package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meeting_id")
    private Long meetingId;

    @Column(nullable = false)
    private String action; // CREATE, EDIT, CANCEL

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String userRole;

    @Column(nullable = false)
    private String userName;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
