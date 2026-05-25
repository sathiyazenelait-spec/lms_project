package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "admin_certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String certificateNumber;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String recipientType; // "STUDENT" or "TEACHER"

    @Column(nullable = false)
    private Long recipientId;

    @Column(nullable = false)
    private String recipientName;

    @Column(length = 2000)
    private String bodyContent;

    @Column(nullable = false)
    private String issuedBy;

    @Column(nullable = false)
    private LocalDate issueDate;

    private Long organizationId;

    @PrePersist
    protected void onCreate() {
        if (issueDate == null) {
            issueDate = LocalDate.now();
        }
        if (certificateNumber == null) {
            certificateNumber = "ACERT-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100);
        }
    }
}
