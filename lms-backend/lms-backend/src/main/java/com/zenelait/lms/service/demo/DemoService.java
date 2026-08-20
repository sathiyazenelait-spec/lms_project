package com.zenelait.lms.service.demo;

import com.zenelait.lms.dto.request.DemoRegisterRequest;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Feature;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.repository.OrganizationRepository;
import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.FeatureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemoService {

    private final OrganizationRepository orgRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final FeatureRepository featureRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public Organization createDemo(DemoRegisterRequest req) {
        if (orgRepository.existsByEmail(req.getOrgEmail())) {
            throw new BadRequestException("An organization with this email already exists.");
        }
        if (adminRepository.existsByEmail(req.getAdminEmail())) {
            throw new BadRequestException("An admin with this email already exists.");
        }

        List<Feature> activeFeatures = featureRepository.findAll().stream()
                .filter(Feature::isActive)
                .collect(Collectors.toList());

        Organization org = Organization.builder()
                .orgCode(generateOrgCode())
                .name(req.getOrgName())
                .email(req.getOrgEmail())
                .phone(req.getOrgPhone())
                .address(req.getOrgAddress())
                .city(req.getOrgCity())
                .country(req.getOrgCountry())
                .description(req.getOrgDescription())
                .features(new HashSet<>(activeFeatures))
                .active(true)
                .isDemo(true)
                .demoEndDate(LocalDateTime.now().plusDays(3))
                .build();

        Organization savedOrg = orgRepository.save(org);

        String generatedAdminUserId = generateAdminUserId();

        Admin superAdmin = Admin.builder()
                .userId(generatedAdminUserId)
                .referralId(generatedAdminUserId)
                .name(req.getAdminName())
                .email(req.getAdminEmail())
                .password(passwordEncoder.encode(req.getAdminPassword()))
                .gender(req.getAdminGender())
                .phone(req.getAdminPhone())
                .academyName(req.getOrgName())
                .organizationId(savedOrg.getId())
                .superAdmin(true)
                .active(true)
                .build();

        adminRepository.save(superAdmin);

        log.info("Temporary demo organization {} and super admin {} created successfully.", savedOrg.getName(), superAdmin.getEmail());
        return savedOrg;
    }

    @Scheduled(fixedDelay = 1800000) // Run every 30 minutes
    public void cleanupExpiredDemos() {
        log.info("Running scheduled cleanup check for expired demo organizations...");
        List<Organization> expired = orgRepository.findByIsDemoTrueAndDemoEndDateBefore(LocalDateTime.now());
        if (expired.isEmpty()) {
            log.info("No expired demo organizations found.");
            return;
        }
        log.info("Found {} expired demo organizations. Skipping physical deletion as per package conversion policy.", expired.size());
    }

    @Transactional
    public void deleteDemoOrganization(Long orgId, String orgName) {
        log.warn("Purging expired demo organization ID: {} ({}) and all related data...", orgId, orgName);

        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");
        try {
            // Delete indirect children (linking tables, etc.)
            jdbcTemplate.update("DELETE FROM parent_child WHERE parent_id IN (SELECT id FROM parents WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM parent_child WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM parent_wallets WHERE parent_id IN (SELECT id FROM parents WHERE organization_id = ?)", orgId);
            
            jdbcTemplate.update("DELETE FROM timetable_slots WHERE teacher_id IN (SELECT id FROM teachers WHERE organization_id = ?) OR batch_id IN (SELECT id FROM batches WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM teacher_reviews WHERE teacher_id IN (SELECT id FROM teachers WHERE organization_id = ?) OR student_id IN (SELECT id FROM students WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM fees WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR batch_id IN (SELECT id FROM batches WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR batch_id IN (SELECT id FROM batches WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM certificates WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR course_id IN (SELECT id FROM courses WHERE organization_id = ?)", orgId, orgId);
            
            jdbcTemplate.update("DELETE FROM exam_students WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR exam_id IN (SELECT id FROM exams WHERE course_id IN (SELECT id FROM courses WHERE organization_id = ?))", orgId, orgId);
            jdbcTemplate.update("DELETE FROM exam_results WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR exam_id IN (SELECT id FROM exams WHERE course_id IN (SELECT id FROM courses WHERE organization_id = ?))", orgId, orgId);
            jdbcTemplate.update("DELETE FROM exams WHERE course_id IN (SELECT id FROM courses WHERE organization_id = ?)", orgId);
            
            jdbcTemplate.update("DELETE FROM live_class_attendance WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR meeting_id IN (SELECT id FROM meetings WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM meeting_participants WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR teacher_id IN (SELECT id FROM teachers WHERE organization_id = ?) OR meeting_id IN (SELECT id FROM meetings WHERE organization_id = ?)", orgId, orgId, orgId);
            jdbcTemplate.update("DELETE FROM meeting_responses WHERE meeting_id IN (SELECT id FROM meetings WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM meeting_questions WHERE meeting_id IN (SELECT id FROM meetings WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM meeting_audit_logs WHERE meeting_id IN (SELECT id FROM meetings WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM meetings WHERE organization_id = ?", orgId);
            
            jdbcTemplate.update("DELETE FROM course_materials WHERE course_id IN (SELECT id FROM courses WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM assignment_submissions WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR assignment_id IN (SELECT id FROM assignments WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM assignments WHERE organization_id = ?", orgId);
            
            jdbcTemplate.update("DELETE FROM assessment_answers WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?))", orgId);
            jdbcTemplate.update("DELETE FROM assessment_attempts WHERE student_id IN (SELECT id FROM students WHERE organization_id = ?) OR assessment_id IN (SELECT id FROM assessments WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM assessment_questions WHERE assessment_id IN (SELECT id FROM assessments WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM assessments WHERE organization_id = ?", orgId);
            
            jdbcTemplate.update("DELETE FROM question_banks WHERE course_id IN (SELECT id FROM courses WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM forum_replies WHERE post_id IN (SELECT id FROM forum_posts WHERE course_id IN (SELECT id FROM courses WHERE organization_id = ?))", orgId);
            jdbcTemplate.update("DELETE FROM forum_posts WHERE course_id IN (SELECT id FROM courses WHERE organization_id = ?)", orgId);
            
            jdbcTemplate.update("DELETE FROM course_enrollment_requests WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM courses WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM batches WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM leave_days WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM razorpay_orders WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM organization_subscriptions WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM contact_messages WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM announcements WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM admin_certificates WHERE organization_id = ?", orgId);
            
            jdbcTemplate.update("DELETE FROM chat_messages WHERE teacher_id IN (SELECT id FROM teachers WHERE organization_id = ?) OR parent_id IN (SELECT id FROM parents WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM otp_verifications WHERE email IN (SELECT email FROM admins WHERE organization_id = ?) OR email IN (SELECT email FROM teachers WHERE organization_id = ?) OR email IN (SELECT email FROM students WHERE organization_id = ?) OR email IN (SELECT email FROM parents WHERE organization_id = ?)", orgId, orgId, orgId, orgId);
            jdbcTemplate.update("DELETE FROM notifications WHERE recipient_email IN (SELECT email FROM admins WHERE organization_id = ?) OR recipient_email IN (SELECT email FROM teachers WHERE organization_id = ?) OR recipient_email IN (SELECT email FROM students WHERE organization_id = ?) OR recipient_email IN (SELECT email FROM parents WHERE organization_id = ?)", orgId, orgId, orgId, orgId);
            
            // Core users and department tables
            jdbcTemplate.update("DELETE FROM admins WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM teachers WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM students WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM parents WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM departments WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM organization_features WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM organizations WHERE id = ?", orgId);

            log.info("Expired demo organization ID: {} successfully purged.", orgId);
        } finally {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
        }
    }

    private String generateOrgCode() {
        String prefix = String.format("ORG-%d-", Year.now().getValue());
        return orgRepository.findLastOrgCodeByPrefix(prefix)
                .map(last -> {
                    int next = Integer.parseInt(last.substring(prefix.length())) + 1;
                    return String.format("ORG-%d-%03d", Year.now().getValue(), next);
                })
                .orElse(prefix + "001");
    }

    private String generateAdminUserId() {
        String prefix = String.format("ADM-%d-", Year.now().getValue());
        return adminRepository.findLastUserIdByPrefix(prefix)
                .map(last -> {
                    int next = Integer.parseInt(last.substring(prefix.length())) + 1;
                    return String.format("ADM-%d-%03d", Year.now().getValue(), next);
                })
                .orElse(prefix + "001");
    }
}
