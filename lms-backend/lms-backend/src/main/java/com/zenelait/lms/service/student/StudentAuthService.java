package com.zenelait.lms.service.student;

import com.zenelait.lms.dto.request.AdminRegisterStudentRequest;
import com.zenelait.lms.dto.request.LoginRequest;
import com.zenelait.lms.dto.request.StudentRegisterRequest;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.entity.Student;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.repository.BatchRepository;
import com.zenelait.lms.repository.CourseRepository;
import com.zenelait.lms.repository.OrganizationRepository;
import com.zenelait.lms.repository.StudentRepository;
import com.zenelait.lms.security.JwtUtils;
import com.zenelait.lms.service.admin.DepartmentService;

import com.zenelait.lms.service.notification.NotificationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentAuthService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final DepartmentService departmentService;
    private final NotificationService notificationService;
    private final OrganizationRepository organizationRepository;
    private final BatchRepository batchRepository;
    private final CourseRepository courseRepository;
    // ── Register ───────────────────────────────────────────────────────
    public AuthResponse register(StudentRegisterRequest req) {

        if (studentRepository.existsByEmail(req.getEmail())) {
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

        Student student = Student.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .gender(req.getGender())
                .phone(req.getPhone())
                .department(req.getDepartment())
                .departmentId(deptId)
                .organizationId(org.getId()) // ✅ SET HERE
                .userId(generateUserId())
                .active(true)
                .build();

        studentRepository.save(student);
        List<String> emailWarnings = notificationService.onStudentRegistered(student);
        AuthResponse resp = buildResponse(student);
        resp.setEmailWarnings(emailWarnings);
        return resp;
    }

    // ── Login (only checks the students table) ────────────────────────
    //    If an admin/teacher/parent email is supplied here → rejected.
    public AuthResponse login(LoginRequest req) {
        Student student = studentRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException(
                        "Invalid credentials. No student account found for this email."));

        if (!student.isActive()) {
            throw new BadRequestException("Your student account has been deactivated.");
        }

        if (!passwordEncoder.matches(req.getPassword(), student.getPassword())) {
            throw new BadRequestException("Invalid credentials. Wrong password.");
        }

        return buildResponse(student);
    }

    // ── Refresh ───────────────────────────────────────────────────────
    public AuthResponse refresh(String refreshToken) {
        String email = jwtUtils.extractUsername(refreshToken);
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (!jwtUtils.isTokenValid(refreshToken, student)) {
            throw new BadRequestException("Refresh token expired or invalid");
        }

        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(student))
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(student.getId())
                .userCode(student.getUserId())
                .name(student.getName())
                .email(student.getEmail())
                .role("STUDENT")
                .organizationId(student.getOrganizationId())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private AuthResponse buildResponse(Student student) {
        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(student))
                .refreshToken(jwtUtils.generateRefreshToken(student))
                .tokenType("Bearer")
                .userId(student.getId())
                .userCode(student.getUserId())
                .name(student.getName())
                .email(student.getEmail())
                .role("STUDENT")
                .organizationId(student.getOrganizationId())
                .build();
    }

    private String generateUserId() {
        // Use the highest existing DB id + 1 so it never collides after restarts or deletions
        long next = studentRepository.findTopByOrderByIdDesc()
                .map(s -> s.getId() + 1)
                .orElse(1L);
        return String.format("STU-%d-%03d", Year.now().getValue(), next);
    }

    public AuthResponse createByAdmin(AdminRegisterStudentRequest req, Admin admin) {

        if (studentRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        

        Student student = new Student();
        student.setName(req.getName());
        student.setEmail(req.getEmail());
        student.setPassword(passwordEncoder.encode(req.getPassword()));
        
        student.setDepartmentId(req.getDepartmentId());

        // ✅ FIX 2: set organizationId (from request OR admin)
        student.setOrganizationId(req.getOrganizationId());
        student.setUserId(generateUserId());
        student.setActive(true);
        student.setDepartment(departmentService.findByDepId(req.getDepartmentId()));

        studentRepository.save(student);

        // ✅ Assign batch
       

        // ✅ Assign courses
        

        return buildResponse(student);
    }
}