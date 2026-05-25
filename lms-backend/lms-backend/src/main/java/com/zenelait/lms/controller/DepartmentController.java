package com.zenelait.lms.controller;

import com.zenelait.lms.dto.request.DepartmentRequest;
import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Department;
import com.zenelait.lms.service.admin.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    // ══════════════════════════════════════════════════════════════════════
    // PUBLIC — used by registration forms (students, teachers)
    // No auth required — anyone can fetch the active department list
    // GET /api/departments
    // ══════════════════════════════════════════════════════════════════════

    @GetMapping("/api/departments")
    public ResponseEntity<ApiResponse<List<Department>>> getActiveDepartments() {
        return ResponseEntity.ok(
                ApiResponse.ok("Active departments", departmentService.getActiveDepartments()));
    }

    // ══════════════════════════════════════════════════════════════════════
    // ADMIN — full CRUD under /api/admin/departments
    // ══════════════════════════════════════════════════════════════════════

    /** GET /api/admin/departments — all departments (including inactive) */
    @GetMapping("/api/admin/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Department>>> getAllDepartments(@AuthenticationPrincipal Admin admin) {
    	Long orgId=admin.getOrganizationId();
    	if(orgId==null || orgId <=0) {
    		return ResponseEntity.ok(ApiResponse.ok("No deparment found by the admin",List.of()));
    	}
        return ResponseEntity.ok(
                ApiResponse.ok("All departments", departmentService.getOrgDepartments(orgId)));
    }
    
    @GetMapping("/api/admin/organizations/{orgId}/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Department>>> getDepartmentOrgId(
            @PathVariable Long orgId) {

        List<Department> departments = departmentService.getOrgDepartments(orgId);

        return ResponseEntity.ok(ApiResponse.ok(departments));
    }

    /** POST /api/admin/departments — create a new department */
    @PostMapping("/api/admin/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> createDepartment(@AuthenticationPrincipal Admin admin,
            @Valid @RequestBody DepartmentRequest req) {
        Department dept = departmentService.create(req,admin);
        return ResponseEntity.ok(ApiResponse.ok("Department created successfully", dept));
    }

    /** PUT /api/admin/departments/{id} — update name / description */
    @PutMapping("/api/admin/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest req) {
        Department dept = departmentService.update(id, req);
        return ResponseEntity.ok(ApiResponse.ok("Department updated successfully", dept));
    }

    /** PATCH /api/admin/departments/{id}/toggle — activate / deactivate */
    @PatchMapping("/api/admin/departments/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> toggleDepartment(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean active = body.getOrDefault("active", true);
        Department dept = departmentService.toggleActive(id, active);
        return ResponseEntity.ok(ApiResponse.ok(
                active ? "Department activated" : "Department deactivated", dept));
    }

    /** DELETE /api/admin/departments/{id} */
    @DeleteMapping("/api/admin/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Department deleted", null));
    }
}
