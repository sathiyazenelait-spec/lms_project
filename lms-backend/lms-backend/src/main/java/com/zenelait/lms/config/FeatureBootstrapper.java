package com.zenelait.lms.config;

import com.zenelait.lms.entity.Feature;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.repository.FeatureRepository;
import com.zenelait.lms.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class FeatureBootstrapper {

    private final FeatureRepository featureRepository;
    private final OrganizationRepository organizationRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void bootstrapFeatures() {
        log.info("Bootstrapping default features...");

        List<Feature> defaults = List.of(
            Feature.builder()
                .name("Parent Wallet")
                .featureKey("PARENT_WALLET")
                .description("Enables wallet balance recharge and fee payments for parents.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Meetings & Live Classes")
                .featureKey("MEETINGS")
                .description("Enables scheduling and conducting live interactive video meetings and classes.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Teacher Performance & Reviews")
                .featureKey("TEACHER_REVIEWS")
                .description("Enables students to review teachers and admins to track performance ratings.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Certificates")
                .featureKey("CERTIFICATES")
                .description("Enables generation, issuance and management of certificates for achievements.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Course Forums")
                .featureKey("FORUMS")
                .description("Enables discussion forums for students and teachers within courses.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Schedules & Timetable")
                .featureKey("TIMETABLE")
                .description("Enables visual schedules, batch slot management and calendars.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Fees & Payments")
                .featureKey("FEES")
                .description("Enables fee installment management and online payment portals.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Announcements")
                .featureKey("ANNOUNCEMENTS")
                .description("Enables system-wide and class-specific announcements and alerts.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Attendance Tracking")
                .featureKey("ATTENDANCE")
                .description("Enables tracking class attendance records for students.")
                .active(true)
                .build(),
            Feature.builder()
                .name("Tasks & Assignments")
                .featureKey("ASSIGNMENTS")
                .description("Enables creation, submission and grading of assignments.")
                .active(true)
                .build()
        );

        for (Feature f : defaults) {
            if (!featureRepository.existsByFeatureKey(f.getFeatureKey())) {
                Feature saved = featureRepository.save(f);
                log.info("Created default feature: {}", f.getFeatureKey());
                
                // Assign to all existing organizations by default
                for (Organization org : organizationRepository.findAll()) {
                    org.getFeatures().add(saved);
                    organizationRepository.save(org);
                    log.info("Assigned feature {} to organization {}", saved.getFeatureKey(), org.getName());
                }
            }
        }
    }
}
