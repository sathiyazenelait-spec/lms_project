package com.zenelait.lms.controller;

import com.zenelait.lms.dto.request.*;
import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.service.admin.AdminAuthService;
import com.zenelait.lms.service.parent.ParentAuthService;
import com.zenelait.lms.service.student.StudentAuthService;
import com.zenelait.lms.service.teacher.TeacherAuthService;
import com.zenelait.lms.service.ultrasuperadmin.UltraSuperAdminAuthService;
import com.zenelait.lms.entity.OtpVerification;
import com.zenelait.lms.repository.OtpVerificationRepository;
import com.zenelait.lms.repository.StudentRepository;
import com.zenelait.lms.repository.TeacherRepository;
import com.zenelait.lms.repository.ParentRepository;
import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.UltraSuperAdminRepository;
import com.zenelait.lms.service.mail.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.zenelait.lms.exception.BadRequestException;
import java.time.LocalDateTime;
import java.util.Random;

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

    private final OtpVerificationRepository otpVerificationRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository parentRepository;
    private final AdminRepository adminRepository;
    private final UltraSuperAdminRepository usaRepository;
    
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

    // ══════════════════════════════════════════════════════════════════
    // PASSWORD RESET VIA EMAIL OTP
    // ══════════════════════════════════════════════════════════════════

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String roleStr = body.get("role");
        if (email == null || email.isBlank() || roleStr == null || roleStr.isBlank()) {
            throw new BadRequestException("Email and role are required");
        }

        String role = roleStr.toUpperCase();
        String name = "";

        // Verify user exists based on role
        switch (role) {
            case "STUDENT":
                var student = studentRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("No Student account found with email: " + email));
                name = student.getName();
                break;
            case "TEACHER":
                var teacher = teacherRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("No Teacher account found with email: " + email));
                name = teacher.getName();
                break;
            case "PARENT":
                var parent = parentRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("No Parent account found with email: " + email));
                name = parent.getName();
                break;
            case "ADMIN":
                var admin = adminRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("No Admin account found with email: " + email));
                name = admin.getName();
                break;
            case "ULTRA_SUPER_ADMIN":
                var usa = usaRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("No Ultra Super Admin account found with email: " + email));
                name = usa.getName();
                break;
            default:
                throw new BadRequestException("Invalid role specified: " + role);
        }

        // Clean up old OTPs for this email and role
        otpVerificationRepository.deleteByEmailAndRole(email, role);

        // Generate 6 digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save new OTP
        OtpVerification otpVerification = OtpVerification.builder()
                .email(email)
                .role(role)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .build();
        otpVerificationRepository.save(otpVerification);

        // Send email
        String emailBody = emailService.forgotPasswordOtpEmail(name, otp);
        emailService.send(email, "Password Reset Verification Code - ZenelaitLMS", emailBody);

        return ResponseEntity.ok(ApiResponse.ok("OTP sent to your email successfully", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String roleStr = body.get("role");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (email == null || email.isBlank() || roleStr == null || roleStr.isBlank() ||
                otp == null || otp.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException("All fields (email, role, otp, newPassword) are required");
        }

        String role = roleStr.toUpperCase();

        // Verify OTP
        OtpVerification otpVerification = otpVerificationRepository.findByEmailAndRoleAndOtp(email, role, otp)
                .orElseThrow(() -> new BadRequestException("Invalid verification code (OTP)"));

        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpVerificationRepository.delete(otpVerification);
            throw new BadRequestException("Verification code has expired. Please request a new one.");
        }

        String encodedPassword = passwordEncoder.encode(newPassword);

        // Reset password based on role
        switch (role) {
            case "STUDENT":
                var student = studentRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("User not found"));
                student.setPassword(encodedPassword);
                studentRepository.save(student);
                break;
            case "TEACHER":
                var teacher = teacherRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("User not found"));
                teacher.setPassword(encodedPassword);
                teacherRepository.save(teacher);
                break;
            case "PARENT":
                var parent = parentRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("User not found"));
                parent.setPassword(encodedPassword);
                parentRepository.save(parent);
                break;
            case "ADMIN":
                var admin = adminRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("User not found"));
                admin.setPassword(encodedPassword);
                adminRepository.save(admin);
                break;
            case "ULTRA_SUPER_ADMIN":
                var usa = usaRepository.findByEmail(email)
                        .orElseThrow(() -> new BadRequestException("User not found"));
                usa.setPassword(encodedPassword);
                usaRepository.save(usa);
                break;
            default:
                throw new BadRequestException("Invalid role");
        }

        // Delete OTP
        otpVerificationRepository.delete(otpVerification);

        return ResponseEntity.ok(ApiResponse.ok("Password reset successful", null));
    }
}
