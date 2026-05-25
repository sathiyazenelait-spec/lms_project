package com.zenelait.lms.service.teacher;

import com.zenelait.lms.dto.request.AdminRegisterTeacherRequest;
import com.zenelait.lms.dto.request.LoginRequest;
import com.zenelait.lms.dto.request.TeacherRegisterRequest;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.entity.Teacher;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.repository.OrganizationRepository;
import com.zenelait.lms.repository.TeacherRepository;
import com.zenelait.lms.security.JwtUtils;
import com.zenelait.lms.service.admin.DepartmentService;

import com.zenelait.lms.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class TeacherAuthService {

    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final DepartmentService departmentService;
    private final NotificationService notificationService;
    private final OrganizationRepository organizationRepository;
    private final AtomicLong counter = new AtomicLong(1);

    // ── Register ───────────────────────────────────────────────────────
    public AuthResponse register(TeacherRegisterRequest req) {

        if (teacherRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered: " + req.getEmail());
        }
        
        departmentService.validateDepartmentName(req.getDepartment());
     // ✅ Find organization by name
        Organization org = organizationRepository.findByName(req.getOrganizationName())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid Organization: " + req.getOrganizationName()));
        
        Long deptId=departmentService.findByDepName(req.getDepartment(),org.getId());
        
        if (!org.isActive()) {
            throw new BadRequestException("Organization is inactive");
        }
        Teacher teacher = Teacher.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .gender(req.getGender())
                .phone(req.getPhone())
                .department(req.getDepartment())
                .departmentId(deptId)
                .organizationId(org.getId())
                .qualification(req.getQualification())
                .userId(generateUserId())
                .active(true)
                .build();

        teacherRepository.save(teacher);
        List<String> emailWarnings = notificationService.onTeacherRegistered(teacher);
        AuthResponse resp = buildResponse(teacher);
        resp.setEmailWarnings(emailWarnings);
        return resp;
    }
    
    
    public AuthResponse createByAdmin(AdminRegisterTeacherRequest req,Admin admin) {
    	if(teacherRepository.existsByEmail(req.getEmail())) {
    		throw new BadRequestException("Email already exists");
    	}
    	Teacher teacher = new Teacher();
        teacher.setName(req.getName());
        teacher.setEmail(req.getEmail());
        teacher.setPassword(passwordEncoder.encode(req.getPassword()));
        
        teacher.setDepartmentId(req.getDepartmentId());

        // ✅ FIX 2: set organizationId (from request OR admin)
        teacher.setOrganizationId(req.getOrganizationId());
        teacher.setUserId(generateUserId());
        teacher.setActive(true);
        teacher.setDepartment(departmentService.findByDepId(req.getDepartmentId()));
    	teacherRepository.save(teacher);
    	 
    	return buildResponse(teacher);
    }

    // ── Login (only checks the teachers table) ────────────────────────
    public AuthResponse login(LoginRequest req) {
        Teacher teacher = teacherRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid credentials. No teacher account found for this email."));

        if (!teacher.isActive()) {
            throw new BadRequestException("Your teacher account has been deactivated.");
        }

        if (!passwordEncoder.matches(req.getPassword(), teacher.getPassword())) {
            throw new BadRequestException("Invalid credentials. Wrong password.");
        }

        return buildResponse(teacher);
    }

    // ── Refresh ───────────────────────────────────────────────────────
    public AuthResponse refresh(String refreshToken) {
        String email = jwtUtils.extractUsername(refreshToken);
        Teacher teacher = teacherRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (!jwtUtils.isTokenValid(refreshToken, teacher)) {
            throw new BadRequestException("Refresh token expired or invalid");
        }

        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(teacher))
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(teacher.getId())
                .userCode(teacher.getUserId())
                .name(teacher.getName())
                .email(teacher.getEmail())
                .role("TEACHER")
                .organizationId(teacher.getOrganizationId())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private AuthResponse buildResponse(Teacher teacher) {
        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(teacher))
                .refreshToken(jwtUtils.generateRefreshToken(teacher))
                .tokenType("Bearer")
                .userId(teacher.getId())
                .userCode(teacher.getUserId())
                .name(teacher.getName())
                .email(teacher.getEmail())
                .role("TEACHER")
                .organizationId(teacher.getOrganizationId())
                .build();
    }

    private String generateUserId() {
    	long next=teacherRepository.findTopByOrderByIdDesc()
                .map(s -> s.getId() + 1)
                .orElse(1L);
        return String.format("TCH-%d-%03d", Year.now().getValue(), next);
    }
}
