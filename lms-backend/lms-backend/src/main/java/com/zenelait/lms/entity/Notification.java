package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    public enum NotificationType { INFO, WARNING, SUCCESS, ERROR }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Stored as email string so it works across all 4 separate tables
     * (Admin, Student, Teacher, Parent) without a polymorphic FK.
     */
    @Column(nullable = false)
    private String recipientEmail;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String message;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NotificationType type = NotificationType.INFO;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
