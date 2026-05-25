package com.zenelait.lms.service.parent;

import com.zenelait.lms.dto.request.AdminRegisterParentRequest;
import com.zenelait.lms.dto.request.LoginRequest;
import com.zenelait.lms.dto.request.ParentRegisterRequest;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.entity.Parent;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.repository.OrganizationRepository;
import com.zenelait.lms.repository.ParentRepository;
import com.zenelait.lms.security.JwtUtils;
import com.zenelait.lms.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class ParentAuthService {

    private final ParentRepository parentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final NotificationService notificationService;
    private final OrganizationRepository orgRepo;

    private final AtomicLong counter = new AtomicLong(1);

    // ── Register ───────────────────────────────────────────────────────
    public AuthResponse register(ParentRegisterRequest req) {

        if (parentRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered: " + req.getEmail());
        }
        
        // ✅ Find organization by name
        Organization org = orgRepo.findByName(req.getOrganizationName())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid Organization: " + req.getOrganizationName()));
        if (!org.isActive()) {
            throw new BadRequestException("Organization is inactive");
        }
        
        Parent parent = Parent.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .gender(req.getGender())
                .phone(req.getPhone())
                .organizationId(org.getId())
                .userId(generateUserId())
                .active(true)
                .build();

        parentRepository.save(parent);
        List<String> emailWarnings = notificationService.onParentRegistered(parent);
        AuthResponse resp = buildResponse(parent);
        resp.setEmailWarnings(emailWarnings);
        return resp;
    }
    public AuthResponse createByAdmin(AdminRegisterParentRequest req,Admin admin) {
    	if(parentRepository.existsByEmail(req.getEmail())) {
    		throw new BadRequestException("This email is already used ");
    	}
    	Parent parent=new Parent();
    	parent.setName(req.getName());
    	parent.setEmail(req.getEmail());
    	parent.setPassword(passwordEncoder.encode(req.getPassword()));
    	parent.setUserId(generateUserId());
    	parent.setOrganizationId(req.getOrganizationId());
    	parent.setActive(true);
    	parentRepository.save(parent);
    	return buildResponse(parent);
    }

    // ── Login (only checks the parents table) ─────────────────────────
    public AuthResponse login(LoginRequest req) {
        Parent parent = parentRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid credentials. No parent account found for this email."));

        if (!parent.isActive()) {
            throw new BadRequestException("Your parent account has been deactivated.");
        }

        if (!passwordEncoder.matches(req.getPassword(), parent.getPassword())) {
            throw new BadRequestException("Invalid credentials. Wrong password.");
        }

        return buildResponse(parent);
    }

    // ── Refresh ───────────────────────────────────────────────────────
    public AuthResponse refresh(String refreshToken) {
        String email = jwtUtils.extractUsername(refreshToken);
        Parent parent = parentRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (!jwtUtils.isTokenValid(refreshToken, parent)) {
            throw new BadRequestException("Refresh token expired or invalid");
        }

        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(parent))
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(parent.getId())
                .userCode(parent.getUserId())
                .name(parent.getName())
                .email(parent.getEmail())
                .role("PARENT")
                .organizationId(parent.getOrganizationId())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private AuthResponse buildResponse(Parent parent) {
        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(parent))
                .refreshToken(jwtUtils.generateRefreshToken(parent))
                .tokenType("Bearer")
                .userId(parent.getId())
                .userCode(parent.getUserId())
                .name(parent.getName())
                .email(parent.getEmail())
                .role("PARENT")
                .organizationId(parent.getOrganizationId())
                .build();
    }

    private String generateUserId() {
    	long next=parentRepository.findTopByOrderByIdDesc()
                .map(s -> s.getId() + 1)
                .orElse(1L);
        return String.format("PAR-%d-%03d", Year.now().getValue(), next);
    }
}