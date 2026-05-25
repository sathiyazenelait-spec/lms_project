package com.zenelait.lms.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.RazorpayOrder;
import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.RazorpayOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@Slf4j
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PaymentController {

    private final RazorpayOrderRepository razorpayOrderRepository;
    private final AdminRepository adminRepository;

    @Value("${razorpay.key:rzp_test_placeholderkey}")
    private String razorpayKey;

    @Value("${razorpay.secret:placeholdersecret}")
    private String razorpaySecret;

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(@RequestBody Map<String, Object> body) {
        try {
            // Get authenticated user details
            org.springframework.security.core.Authentication auth = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
            }
            Object principal = auth.getPrincipal();
            String email = (principal instanceof org.springframework.security.core.userdetails.UserDetails) ?
                    ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername() : auth.getName();
            String role = auth.getAuthorities().stream()
                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_UNKNOWN");

            double amount = Double.parseDouble(body.get("amount").toString());
            int amountInPaise = (int) Math.round(amount * 100);

            RazorpayClient razorpay = new RazorpayClient(razorpayKey, razorpaySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            Order order = razorpay.orders.create(orderRequest);
            String orderId = order.get("id");

            // Determine organizationId for this order (admin users carry their org)
            Long organizationId = null;
            if (principal instanceof Admin adminPrincipal) {
                organizationId = adminPrincipal.getOrganizationId();
            } else if (principal instanceof UserDetails) {
                // Look up by email in admin table as fallback
                organizationId = adminRepository.findByEmail(email)
                        .map(Admin::getOrganizationId).orElse(null);
            }

            // Persist the order securely under the user's name/email context
            RazorpayOrder razorpayOrder = RazorpayOrder.builder()
                    .orderId(orderId)
                    .email(email)
                    .role(role)
                    .amount(amount)
                    .status("PENDING")
                    .organizationId(organizationId)
                    .createdAt(LocalDateTime.now())
                    .build();
            razorpayOrderRepository.save(razorpayOrder);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderId);
            response.put("amount", amountInPaise);
            response.put("currency", "INR");
            response.put("keyId", razorpayKey);

            return ResponseEntity.ok(ApiResponse.ok("Order created successfully", response));
        } catch (Exception e) {
            log.error("Error creating Razorpay order", e);
            return ResponseEntity.status(500).body(ApiResponse.ok("Failed to create order: " + e.getMessage(), null));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPayment(@RequestBody Map<String, String> body) {
        try {
            String orderId = body.get("orderId");
            String paymentId = body.get("paymentId");
            String signature = body.get("signature");

            // Get authenticated user details
            org.springframework.security.core.Authentication auth = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
            }
            Object principal = auth.getPrincipal();
            String email = (principal instanceof org.springframework.security.core.userdetails.UserDetails) ?
                    ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername() : auth.getName();

            // Look up order in database
            RazorpayOrder razorpayOrder = razorpayOrderRepository.findById(orderId).orElse(null);
            if (razorpayOrder == null) {
                log.warn("Payment verification failed: Order ID {} not found in database", orderId);
                return ResponseEntity.ok(ApiResponse.ok("Order not found", Map.of("verified", false)));
            }

            // Security constraint: The order must belong to the authenticated user
            if (!razorpayOrder.getEmail().equals(email)) {
                log.warn("Security violation: User {} attempted to verify order {} belonging to {}", 
                        email, orderId, razorpayOrder.getEmail());
                return ResponseEntity.status(403).body(ApiResponse.ok("Access denied: Order ownership mismatch", Map.of("verified", false)));
            }

            String generatedSignature = calculateRFC2104HMAC(orderId + "|" + paymentId, razorpaySecret);

            if (generatedSignature.equals(signature)) {
                razorpayOrder.setStatus("SUCCESS");
                razorpayOrderRepository.save(razorpayOrder);
                return ResponseEntity.ok(ApiResponse.ok("Payment verified successfully", Map.of("verified", true)));
            } else {
                log.warn("Signature mismatch for order {}", orderId);
                return ResponseEntity.ok(ApiResponse.ok("Signature verification failed", Map.of("verified", false)));
            }
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            return ResponseEntity.status(500).body(ApiResponse.ok("Verification error: " + e.getMessage(), null));
        }
    }

    /**
     * GET /api/payment/orders — org-scoped payment history for logged-in admin.
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<RazorpayOrder>>> getPaymentOrders() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
        }
        Object principal = auth.getPrincipal();
        String email = (principal instanceof UserDetails ud) ? ud.getUsername() : auth.getName();

        Long organizationId = null;
        if (principal instanceof Admin adminPrincipal) {
            organizationId = adminPrincipal.getOrganizationId();
        } else {
            organizationId = adminRepository.findByEmail(email)
                    .map(Admin::getOrganizationId).orElse(null);
        }

        List<RazorpayOrder> orders = organizationId != null
                ? razorpayOrderRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId)
                : razorpayOrderRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    private String calculateRFC2104HMAC(String data, String secret) throws Exception {
        SecretKeySpec signingKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(signingKey);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(rawHmac);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
