package com.zenelait.lms.controller;

import com.zenelait.lms.dto.request.AdminRegisterRequest;
import com.zenelait.lms.dto.request.OrganizationRequest;
import com.zenelait.lms.dto.request.SuperAdminCreateRequest;
import com.zenelait.lms.dto.request.UltraSuperAdminRegisterRequest;
import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.entity.Parent;
import com.zenelait.lms.entity.Student;
import com.zenelait.lms.entity.Teacher;
import com.zenelait.lms.entity.UltraSuperAdmin;
import com.zenelait.lms.entity.Feature;
import com.zenelait.lms.dto.request.FeatureRequest;
import com.zenelait.lms.entity.SubscriptionPackage;
import com.zenelait.lms.entity.OrganizationSubscription;
import com.zenelait.lms.service.subscription.SubscriptionService;
import com.zenelait.lms.exception.ResourceNotFoundException;
import java.util.Set;
import com.zenelait.lms.service.ultrasuperadmin.UltraSuperAdminAuthService;
import com.zenelait.lms.service.ultrasuperadmin.UltraSuperAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * All endpoints here require ROLE_ULTRA_SUPER_ADMIN.
 *
 * Auth (login/register) for USAdmin lives in AuthController:
 *   POST /api/auth/ultra-super-admin/login
 *   POST /api/auth/ultra-super-admin/register  (requires existing USA token)
 *
 * Management endpoints:
 *   GET    /api/ultra-super-admin/profile
 *   GET    /api/ultra-super-admin/stats
 *
 *   POST   /api/ultra-super-admin/organizations
 *   GET    /api/ultra-super-admin/organizations
 *   GET    /api/ultra-super-admin/organizations/{id}
 *   PUT    /api/ultra-super-admin/organizations/{id}
 *   PATCH  /api/ultra-super-admin/organizations/{id}/toggle-active
 *
 *   POST   /api/ultra-super-admin/super-admins
 *   GET    /api/ultra-super-admin/super-admins
 *   GET    /api/ultra-super-admin/super-admins/org/{orgId}
 *   PATCH  /api/ultra-super-admin/admins/{adminId}/toggle-active
 */
@RestController
@RequestMapping("/api/ultra-super-admin")
@PreAuthorize("hasRole('ULTRA_SUPER_ADMIN')")
@RequiredArgsConstructor
public class UltraSuperAdminController {

    private final UltraSuperAdminService    usaService;
    private final UltraSuperAdminAuthService usaAuthService;
    private final SubscriptionService       subscriptionService;
    private final com.zenelait.lms.repository.NotificationRepository notificationRepository;
    private final com.zenelait.lms.repository.ContactMessageRepository contactMessageRepository;

    // ── Profile ───────────────────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UltraSuperAdmin>> getProfile(
            @AuthenticationPrincipal UltraSuperAdmin usa) {
        return ResponseEntity.ok(ApiResponse.ok(usa));
    }

    // ── Platform Stats ────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlatformStats() {
        return ResponseEntity.ok(ApiResponse.ok(usaService.getPlatformStats()));
    }

    // ── Register another Ultra Super Admin ───────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerUltraSuperAdmin(
            @Valid @RequestBody UltraSuperAdminRegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Ultra Super Admin registered successfully",
                usaAuthService.register(req)));
    }

    // ════════════════════════════════════════════════════════════════════
    // ORGANIZATION  endpoints
    // ════════════════════════════════════════════════════════════════════

    @PostMapping("/organizations")
    public ResponseEntity<ApiResponse<Organization>> createOrganization(
            @Valid @RequestBody OrganizationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Organization created successfully",
                usaService.createOrganization(req)));
    }

    @GetMapping("/organizations")
    public ResponseEntity<ApiResponse<List<Organization>>> getAllOrganizations() {
        return ResponseEntity.ok(ApiResponse.ok(usaService.getAllOrganizations()));
    }

    @GetMapping("/organizations/{id}")
    public ResponseEntity<ApiResponse<Organization>> getOrganization(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(usaService.getOrganizationById(id)));
    }

    @PutMapping("/organizations/{id}")
    public ResponseEntity<ApiResponse<Organization>> updateOrganization(
            @PathVariable Long id,
            @Valid @RequestBody OrganizationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Organization updated successfully",
                usaService.updateOrganization(id, req)));
    }

    @PatchMapping("/organizations/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleOrganizationActive(@PathVariable Long id) {
        usaService.toggleOrganizationActive(id);
        return ResponseEntity.ok(ApiResponse.ok("Organization active status toggled", null));
    }
    
    @GetMapping("/organizations/{id}/students")
    public ResponseEntity<ApiResponse<List<Student>>> getStudentsByOrganizations(@PathVariable Long id){
    	List<Student> students = usaService.getOrganizationWiseStudents(id);
    	
    	return ResponseEntity.ok(ApiResponse.ok(students));
    }
    
    @GetMapping("/organizations/{id}/teachers")
    public ResponseEntity<ApiResponse<List<Teacher>>> getTeacherByOrganizations(@PathVariable Long id){
    	List<Teacher> teachers=usaService.getOrganizationWiseTeachers(id);
    	return ResponseEntity.ok(ApiResponse.ok(teachers));
    }
    
    @GetMapping("/organizations/{id}/parents")
    public ResponseEntity<ApiResponse<List<Parent>>> getParentByOrganizations(@PathVariable Long id){
    	List<Parent> Parents=usaService.getOrganizationWiseParents(id);
    	return ResponseEntity.ok(ApiResponse.ok(Parents));
    }
    

    // ════════════════════════════════════════════════════════════════════
    // SUPER ADMIN  endpoints
    // ════════════════════════════════════════════════════════════════════

    @PostMapping("/super-admins")
    public ResponseEntity<ApiResponse<Admin>> createSuperAdmin(
            @Valid @RequestBody SuperAdminCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Super Admin created successfully",
                usaService.createSuperAdmin(req)));
    }

    @GetMapping("/super-admins")
    public ResponseEntity<ApiResponse<List<Admin>>> getAllSuperAdmins() {
        return ResponseEntity.ok(ApiResponse.ok(usaService.getAllSuperAdmins()));
    }

    @GetMapping("/super-admins/org/{orgId}")
    public ResponseEntity<ApiResponse<List<Admin>>> getSuperAdminsByOrg(
            @PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(usaService.getSuperAdminsByOrg(orgId)));
    }

    @PatchMapping("/admins/{adminId}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleAdminActive(@PathVariable Long adminId) {
        usaService.toggleAdminActive(adminId);
        return ResponseEntity.ok(ApiResponse.ok("Admin active status toggled", null));
    }

    // ── Feature Management ──────────────────────────────────────────────────
    @GetMapping("/features")
    public ResponseEntity<ApiResponse<List<Feature>>> getAllFeatures() {
        return ResponseEntity.ok(ApiResponse.ok(usaService.getAllFeatures()));
    }

    @PostMapping("/features")
    public ResponseEntity<ApiResponse<Feature>> createFeature(
            @Valid @RequestBody FeatureRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Feature created successfully",
                usaService.createFeature(req)));
    }

    @PatchMapping("/features/{id}/toggle")
    public ResponseEntity<ApiResponse<Feature>> toggleFeatureActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Feature active status toggled",
                usaService.toggleFeatureActive(id)));
    }

    @GetMapping("/organizations/{orgId}/features")
    public ResponseEntity<ApiResponse<Set<Feature>>> getOrganizationFeatures(
            @PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(usaService.getOrganizationFeatures(orgId)));
    }

    @PostMapping("/organizations/{orgId}/features/{featureId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleOrganizationFeature(
            @PathVariable Long orgId, @PathVariable Long featureId) {
        usaService.toggleOrganizationFeature(orgId, featureId);
        return ResponseEntity.ok(ApiResponse.ok("Organization feature toggled successfully", null));
    }

    // ── Subscription Package Endpoints ────────────────────────────────────────

    @PostMapping("/packages")
    public ResponseEntity<ApiResponse<SubscriptionPackage>> createPackage(@Valid @RequestBody SubscriptionPackage pkg) {
        return ResponseEntity.ok(ApiResponse.ok("Package created successfully", subscriptionService.createPackage(pkg)));
    }

    @GetMapping("/packages")
    public ResponseEntity<ApiResponse<List<SubscriptionPackage>>> getAllPackages() {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getAllPackages()));
    }

    @PatchMapping("/packages/{id}/toggle")
    public ResponseEntity<ApiResponse<SubscriptionPackage>> togglePackageActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Package status toggled successfully", subscriptionService.togglePackageActive(id)));
    }

    @DeleteMapping("/packages/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable Long id) {
        subscriptionService.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.ok("Package deleted successfully", null));
    }

    // ── Organization Subscription Endpoints ────────────────────────────────────

    @GetMapping("/subscriptions")
    public ResponseEntity<ApiResponse<List<OrganizationSubscription>>> getAllSubscriptions() {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getAllSubscriptions()));
    }

    @PostMapping("/subscriptions/assign")
    public ResponseEntity<ApiResponse<OrganizationSubscription>> assignSubscription(
            @RequestBody Map<String, Long> payload) {
        Long orgId = payload.get("organizationId");
        Long packageId = payload.get("packageId");
        if (orgId == null || packageId == null) {
            throw new com.zenelait.lms.exception.BadRequestException("organizationId and packageId are required.");
        }
        return ResponseEntity.ok(ApiResponse.ok("Subscription assigned successfully", subscriptionService.subscribeOrganization(orgId, packageId)));
    }

    // ── Revenue Analysis Endpoints ───────────────────────────────────────────

    @GetMapping("/revenue/analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueAnalysis() {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getRevenueAnalysis()));
    }

    // ── Notification Center Endpoints ────────────────────────────────────────

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<com.zenelait.lms.entity.Notification>>> getNotifications(
            @AuthenticationPrincipal UltraSuperAdmin usa) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(usa.getEmail())));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UltraSuperAdmin usa) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipientEmail().equals(usa.getEmail())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsRead(
            @AuthenticationPrincipal UltraSuperAdmin usa) {
        notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(usa.getEmail())
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }

    // ── Manual Triggers ──────────────────────────────────────────────────────

    @PostMapping("/subscriptions/check-expiry")
    public ResponseEntity<ApiResponse<Void>> triggerExpiryCheck() {
        subscriptionService.manualCheckExpiry();
        return ResponseEntity.ok(ApiResponse.ok("Daily alert check scan triggered successfully.", null));
    }

    @PostMapping("/subscriptions/{id}/remind")
    public ResponseEntity<ApiResponse<Void>> sendRenewalReminder(@PathVariable Long id) {
        subscriptionService.sendManualReminder(id);
        return ResponseEntity.ok(ApiResponse.ok("Renewal reminder email sent successfully.", null));
    }

    // ── Ultra Super Admin Contact Queries ─────────────────────────────────────
    @GetMapping("/contact-messages")
    public ResponseEntity<ApiResponse<List<com.zenelait.lms.entity.ContactMsg>>> getContactMessages(
            @RequestParam(required = false) com.zenelait.lms.entity.ContactMsg.MessageStatus status) {
        List<com.zenelait.lms.entity.ContactMsg> msgs = status != null
                ? contactMessageRepository.findByIsForUltraSuperAdminAndStatus(true, status)
                : contactMessageRepository.findByIsForUltraSuperAdminOrderByReceivedAtDesc(true);
        return ResponseEntity.ok(ApiResponse.ok("Ultra Super Admin contact messages", msgs));
    }

    @PatchMapping("/contact-messages/{id}/status")
    public ResponseEntity<ApiResponse<com.zenelait.lms.entity.ContactMsg>> updateContactStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        com.zenelait.lms.entity.ContactMsg msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new com.zenelait.lms.exception.ResourceNotFoundException("Message not found"));
        if (!msg.isForUltraSuperAdmin()) {
            throw new com.zenelait.lms.exception.BadRequestException("Not authorized for this message");
        }
        try {
            msg.setStatus(com.zenelait.lms.entity.ContactMsg.MessageStatus.valueOf(body.get("status")));
        } catch (Exception ignored) {}
        contactMessageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", msg));
    }

    @DeleteMapping("/contact-messages/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContactMessage(@PathVariable Long id) {
        com.zenelait.lms.entity.ContactMsg msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new com.zenelait.lms.exception.ResourceNotFoundException("Message not found"));
        if (!msg.isForUltraSuperAdmin()) {
            throw new com.zenelait.lms.exception.BadRequestException("Not authorized for this message");
        }
        contactMessageRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Message deleted successfully", null));
    }
}
