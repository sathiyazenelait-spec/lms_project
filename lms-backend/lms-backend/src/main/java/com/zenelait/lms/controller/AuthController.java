package com.zenelait.lms.controller;

import com.zenelait.lms.dto.request.*;
import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.service.admin.AdminAuthService;
import com.zenelait.lms.service.parent.ParentAuthService;
import com.zenelait.lms.service.student.StudentAuthService;
import com.zenelait.lms.service.teacher.TeacherAuthService;
import com.zenelait.lms.service.ultrasuperadmin.UltraSuperAdminAuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Role-isolated auth endpoints.
 *
 * Each role has its OWN register + login + refresh endpoint.
 * Logging in via the wrong role endpoint → BadRequestException → 400 "Invalid credentials".
 *
 * POST /api/auth/admin/register
 * POST /api/auth/admin/login
 * POST /api/auth/admin/refresh
 *
 * POST /api/auth/student/register
 * POST /api/auth/student/login
 * POST /api/auth/student/refresh
 *
 * POST /api/auth/teacher/register
 * POST /api/auth/teacher/login
 * POST /api/auth/teacher/refresh
 *
 * POST /api/auth/parent/register
 * POST /api/auth/parent/login
 * POST /api/auth/parent/refresh
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AdminAuthService   adminAuthService;
    private final StudentAuthService studentAuthService;
    private final TeacherAuthService teacherAuthService;
    private final ParentAuthService  parentAuthService;
    private final UltraSuperAdminAuthService usaAuthService;
    
 // ══════════════════════════════════════════════════════════════════
    // ULTRA SUPER ADMIN  — login + refresh only (register is protected)
    // ══════════════════════════════════════════════════════════════════

    @PostMapping("/ultra-super-admin/login")
    public ResponseEntity<ApiResponse<AuthResponse>> usaLogin(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful",
                usaAuthService.login(req)));
    }

    @PostMapping("/ultra-super-admin/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> usaRefresh(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed",
                usaAuthService.refresh(body.get("refreshToken"))));
    }

    // ══════════════════════════════════════════════════════════════════
    // ADMIN
    // ══════════════════════════════════════════════════════════════════

    @PostMapping("/admin/register")
    public ResponseEntity<ApiResponse<AuthResponse>> adminRegister(
       @Valid     @RequestBody AdminRegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Admin registered successfully",
                adminAuthService.register(req)));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful",
                adminAuthService.login(req)));
    }

    @PostMapping("/admin/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> adminRefresh(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed",
                adminAuthService.refresh(body.get("refreshToken"))));
    }

    // ══════════════════════════════════════════════════════════════════
    // STUDENT
    // ══════════════════════════════════════════════════════════════════

    @PostMapping("/student/register")
    public ResponseEntity<ApiResponse<AuthResponse>> studentRegister(
            @Valid @RequestBody StudentRegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Student registered successfully",
                studentAuthService.register(req)));
    }

    @PostMapping("/student/login")
    public ResponseEntity<ApiResponse<AuthResponse>> studentLogin(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful",
                studentAuthService.login(req)));
    }

    @PostMapping("/student/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> studentRefresh(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed",
                studentAuthService.refresh(body.get("refreshToken"))));
    }

    // ══════════════════════════════════════════════════════════════════
    // TEACHER
    // ══════════════════════════════════════════════════════════════════

    @PostMapping("/teacher/register")
    public ResponseEntity<ApiResponse<AuthResponse>> teacherRegister(
            @Valid @RequestBody TeacherRegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Teacher registered successfully",
                teacherAuthService.register(req)));
    }

    @PostMapping("/teacher/login")
    public ResponseEntity<ApiResponse<AuthResponse>> teacherLogin(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful",
                teacherAuthService.login(req)));
    }

    @PostMapping("/teacher/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> teacherRefresh(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed",
                teacherAuthService.refresh(body.get("refreshToken"))));
    }

    // ══════════════════════════════════════════════════════════════════
    // PARENT
    // ══════════════════════════════════════════════════════════════════

    @PostMapping("/parent/register")
    public ResponseEntity<ApiResponse<AuthResponse>> parentRegister(
            @Valid @RequestBody ParentRegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Parent registered successfully",
                parentAuthService.register(req)));
    }

    @PostMapping("/parent/login")
    public ResponseEntity<ApiResponse<AuthResponse>> parentLogin(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful",
                parentAuthService.login(req)));
    }

    @PostMapping("/parent/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> parentRefresh(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed",
                parentAuthService.refresh(body.get("refreshToken"))));
    }
}
