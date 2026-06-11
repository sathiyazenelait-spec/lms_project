
package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contact_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMsg {

    public enum MessageStatus { NEW, PENDING, RESOLVED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    private String subject;

    @Column(length = 3000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MessageStatus status = MessageStatus.NEW;

    /** Organization this message belongs to (null = legacy/global) */
    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "is_for_ultra_super_admin")
    @Builder.Default
    private boolean isForUltraSuperAdmin = false;

    private LocalDateTime receivedAt;

    @PrePersist
    protected void onCreate() {
        receivedAt = LocalDateTime.now();
    }
}
