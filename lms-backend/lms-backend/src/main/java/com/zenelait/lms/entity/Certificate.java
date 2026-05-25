package com.zenelait.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String certificateNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    private String grade;
    
    @Column(length = 500)
    private String remarks;

    private LocalDate issueDate;

    @PrePersist
    protected void onCreate() {
        if (issueDate == null) {
            issueDate = LocalDate.now();
        }
        if (certificateNumber == null) {
            certificateNumber = "CERT-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100);
        }
    }
}
