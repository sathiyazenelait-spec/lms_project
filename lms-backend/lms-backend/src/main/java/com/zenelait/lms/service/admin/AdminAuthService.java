package com.zenelait.lms.service.admin;

import com.zenelait.lms.dto.request.AdminRegisterRequest;
import com.zenelait.lms.dto.request.LoginRequest;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.DepartmentRepository;
import com.zenelait.lms.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class AdminAuthService {
	
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final DepartmentRepository   departmentRepository;

    private final AtomicLong counter = new AtomicLong(1);

    // ── Register ───────────────────────────────────────────────────────
    public AuthResponse register(AdminRegisterRequest req) {

        if (adminRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered: " + req.getEmail());
        }

        // Referral must be an existing Admin's userId (super-admin gate)
        Admin referrer = adminRepository.findBySuperAdminUserId(req.getReferralId())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid Super Admin Referral ID: " + req.getReferralId()));
        
        if (!referrer.isActive()) {
            throw new BadRequestException("Referral Admin account is inactive");
        }

        Admin admin = Admin.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .gender(req.getGender())
                .phone(req.getPhone())
                .academyName(req.getAcademyName())
                .referralId(req.getReferralId())
                .userId(generateUserId())
                .organizationId(referrer.getOrganizationId())   
                .active(true)
                .build();

        adminRepository.save(admin);
        return buildResponse(admin);
    }
    public Long findOrgId(Admin admin) {
    	
    	return null ;
    }

    // ── Login (only checks the admins table) ──────────────────────────
    public AuthResponse login(LoginRequest req) {
        Admin admin = adminRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid credentials. No admin account found for this email."));

        if (!admin.isActive()) {
            throw new BadRequestException("Your admin account has been deactivated.");
        }
        
        

        if (!passwordEncoder.matches(req.getPassword(), admin.getPassword())) {
            throw new BadRequestException("Invalid credentials. Wrong password.");
        }

        return buildResponse(admin);
    }

    // ── Refresh ───────────────────────────────────────────────────────
    public AuthResponse refresh(String refreshToken) {
        String email = jwtUtils.extractUsername(refreshToken);
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (!jwtUtils.isTokenValid(refreshToken, admin)) {
            throw new BadRequestException("Refresh token expired or invalid");
        }

        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(admin))
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(admin.getId())
                .userCode(admin.getUserId())
                .name(admin.getName())
                .email(admin.getEmail())
                .role("ADMIN")
                .organizationId(admin.getOrganizationId())
                .superAdmin(admin.isSuperAdmin())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private AuthResponse buildResponse(Admin admin) {
        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(admin))
                .refreshToken(jwtUtils.generateRefreshToken(admin))
                .tokenType("Bearer")
                .userId(admin.getId())
                .userCode(admin.getUserId())
                .name(admin.getName())
                .email(admin.getEmail())
                .role("ADMIN")
                .organizationId(admin.getOrganizationId())
                .superAdmin(admin.isSuperAdmin())
                .build();
    }

    private String generateUserId() {
        String prefix = String.format("ADM-%d-", Year.now().getValue());

        return adminRepository.findLastUserIdByPrefix(prefix)
                .map(last -> {
                    int next = Integer.parseInt(last.substring(prefix.length())) + 1;
                    return String.format("ADM-%d-%03d", Year.now().getValue(), next);
                })
                .orElse(prefix + "001");
    }
}
