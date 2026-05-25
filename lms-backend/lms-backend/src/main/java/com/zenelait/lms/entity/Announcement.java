package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements", indexes = {
    @Index(name = "idx_announcement_org_id", columnList = "organization_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000, nullable = false)
    private String content;

    /** Author name stored as plain string (Admin or Teacher) */
    private String authorName;

    @Enumerated(EnumType.STRING)
    private Role targetRole; // null = broadcast to all

    private Long organizationId;
    private Long courseId;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
