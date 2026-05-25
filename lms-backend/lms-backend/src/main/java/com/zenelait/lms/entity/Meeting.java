package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meetings", indexes = {
    @Index(name = "idx_meeting_org_id", columnList = "organization_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // ONLINE, OPINION, OFFLINE

    @Column(nullable = false)
    private String status; // UPCOMING, ONGOING, COMPLETED, CANCELLED

    @Column(name = "organization_id")
    private Long organizationId;

    private Long createdBy;

    private String coordinatorName; // Coordinator/Host

    private LocalDateTime startDate; // Online/Offline only

    private LocalDateTime endDate; // Online/Offline only

    @Column(columnDefinition = "TEXT")
    private String description; // Agenda/Description

    private String recurringType; // ONCE, DAILY, WEEKLY, MONTHLY

    @Column(columnDefinition = "TEXT")
    private String cancelReason;

    @Builder.Default
    private Boolean reminderSent = false;

    @Builder.Default
    private Boolean deadlineReminderSent = false;

    // Online-specific
    private String platformType; // ZOOM, MEET, TEAMS, OTHER
    private String joinLink;

    // Offline-specific
    private String venue;

    // Opinion-specific
    private LocalDateTime deadline;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (reminderSent == null) reminderSent = false;
        if (deadlineReminderSent == null) deadlineReminderSent = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
