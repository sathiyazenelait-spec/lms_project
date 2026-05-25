package com.zenelait.lms.service.ultrasuperadmin;

import com.zenelait.lms.dto.request.LoginRequest;
import com.zenelait.lms.dto.request.UltraSuperAdminRegisterRequest;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.entity.UltraSuperAdmin;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.repository.UltraSuperAdminRepository;
import com.zenelait.lms.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Year;

@Service
@RequiredArgsConstructor
public class UltraSuperAdminAuthService {

    private final UltraSuperAdminRepository usaRepository;
    private final PasswordEncoder           passwordEncoder;
    private final JwtUtils                  jwtUtils;

    // ── Register ───────────────────────────────────────────────────────────────
    /**
     * Creates a new Ultra Super Admin account.
     * This endpoint is protected by ROLE_ULTRA_SUPER_ADMIN — only an existing
     * USA can create another one.
     * The very first USA must be inserted directly into the DB (SQL seed).
     */
    public AuthResponse register(UltraSuperAdminRegisterRequest req) {
        if (usaRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered: " + req.getEmail());
        }

        UltraSuperAdmin usa = UltraSuperAdmin.builder()
                .userId(generateUserId())
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .active(true)
                .build();

        usaRepository.save(usa);
        return buildResponse(usa);
    }

    // ── Login ──────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req) {
        UltraSuperAdmin usa = usaRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid credentials. No Ultra Super Admin account found for this email."));

        if (!usa.isActive()) {
            throw new BadRequestException("Your Ultra Super Admin account has been deactivated.");
        }

        if (!passwordEncoder.matches(req.getPassword(), usa.getPassword())) {
            throw new BadRequestException("Invalid credentials. Wrong password.");
        }

        return buildResponse(usa);
    }

    // ── Refresh ────────────────────────────────────────────────────────────────
    public AuthResponse refresh(String refreshToken) {
        String email = jwtUtils.extractUsername(refreshToken);
        UltraSuperAdmin usa = usaRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (!jwtUtils.isTokenValid(refreshToken, usa)) {
            throw new BadRequestException("Refresh token expired or invalid");
        }

        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(usa))
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(usa.getId())
                .userCode(usa.getUserId())
                .name(usa.getName())
                .email(usa.getEmail())
                .role("ULTRA_SUPER_ADMIN")
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    private AuthResponse buildResponse(UltraSuperAdmin usa) {
        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(usa))
                .refreshToken(jwtUtils.generateRefreshToken(usa))
                .tokenType("Bearer")
                .userId(usa.getId())
                .userCode(usa.getUserId())
                .name(usa.getName())
                .email(usa.getEmail())
                .role("ULTRA_SUPER_ADMIN")
                .build();
    }

    private String generateUserId() {
        String prefix = String.format("USA-%d-", Year.now().getValue());
        return usaRepository.findLastUserIdByPrefix(prefix)
                .map(last -> {
                    int next = Integer.parseInt(last.substring(prefix.length())) + 1;
                    return String.format("USA-%d-%03d", Year.now().getValue(), next);
                })
                .orElse(prefix + "001");
    }
}
