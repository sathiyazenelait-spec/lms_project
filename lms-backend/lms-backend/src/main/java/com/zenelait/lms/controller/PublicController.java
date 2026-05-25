package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.ContactMsg;
import com.zenelait.lms.entity.Department;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.repository.ContactMessageRepository;
import com.zenelait.lms.repository.OrganizationRepository;
import com.zenelait.lms.service.admin.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicController {

    private final DepartmentService        departmentService;
    private final ContactMessageRepository contactMessageRepository;
    private final OrganizationRepository orgRepo;
    private final com.zenelait.lms.service.ultrasuperadmin.UltraSuperAdminService usaService;

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<Department>>> getActiveDepartments() {
        return ResponseEntity.ok(
                ApiResponse.ok("Active departments", departmentService.getActiveDepartments()));
    }
    
    @GetMapping("/organizations")
    public ResponseEntity<ApiResponse<List<Organization>>> getActiveOrganizations(){
    	return ResponseEntity.ok(ApiResponse.ok("Active organizations", usaService.getActiveOrganizations()));
    }

    @GetMapping("/organizations/{id}/departments")
    public ResponseEntity<ApiResponse<List<Department>>> getOrgDepartmentsPublic(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok("Organization departments", departmentService.getOrgDepartments(id)));
    }

    @GetMapping("/organizations/{id}/features")
    public ResponseEntity<ApiResponse<java.util.Set<com.zenelait.lms.entity.Feature>>> getOrganizationFeatures(
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Organization features", usaService.getOrganizationFeatures(id)));
        } catch (com.zenelait.lms.exception.ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Organization not found"));
        }
    }
    

    /**
     * POST /api/public/contact
     * Submits a contact form message — no auth required.
     */
    @PostMapping("/contact")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitContact(
            @RequestBody Map<String, Object> body) {

        String name    = trim(body, "name");
        String email   = trim(body, "email");
        String phone   = trim(body, "phone");
        String subject = trim(body, "subject");
        String message = trim(body, "message");

        if (name.isBlank())         return bad("Name is required.");
        if (email.isBlank())        return bad("Email address is required.");
        if (!email.contains("@"))   return bad("Please enter a valid email address.");
        if (phone.isBlank())        return bad("Phone number is required.");

        Long organizationId = null;
        if (body.containsKey("organizationId") && body.get("organizationId") != null) {
            Object rawOrgId = body.get("organizationId");
            if (rawOrgId instanceof Number) {
                organizationId = ((Number) rawOrgId).longValue();
            } else {
                String strOrgId = rawOrgId.toString().trim();
                if (!strOrgId.isEmpty()) {
                    try {
                        if (strOrgId.contains(".")) {
                            organizationId = Double.valueOf(strOrgId).longValue();
                        } else {
                            organizationId = Long.valueOf(strOrgId);
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        ContactMsg msg = ContactMsg.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .subject(subject.isBlank() ? "General Enquiry" : subject)
                .message(message)
                .organizationId(organizationId)
                .status(ContactMsg.MessageStatus.NEW)
                .build();

        contactMessageRepository.save(msg);

        return ResponseEntity.ok(ApiResponse.ok("Message received",
                Map.of("id", msg.getId(), "receivedAt", msg.getReceivedAt().toString())));
    }

    private String trim(Map<String, Object> body, String key) {
        return body.containsKey(key) && body.get(key) != null
                ? body.get(key).toString().trim() : "";
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> bad(String error) {
        return ResponseEntity.badRequest().body(ApiResponse.error(error));
    }
}
