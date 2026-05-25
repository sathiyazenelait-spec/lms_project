package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "assignments",
    indexes = {
        @Index(name = "idx_assign_course", columnList = "course_id"),
        @Index(name = "idx_assign_teacher", columnList = "teacher_id"),
        @Index(name = "idx_assign_org", columnList = "organizationId")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"enrolledStudents", "teacher", "hibernateLazyInitializer", "handler"})
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnoreProperties({"courses", "hibernateLazyInitializer", "handler"})
    private Teacher teacher;

    private LocalDateTime dueDate;
    private int maxMarks;

    private String taskType; // Homework, Project, Lab, Quiz, etc.

    @Column(columnDefinition = "LONGTEXT")
    private String attachments; // JSON or comma-separated list of file URLs/names

    private String submissionType; // TEXT, FILE, LINK, ANY

    private String allowedFileTypes; // e.g. "PDF,DOCX,PNG"

    private Integer maxFileSize; // in MB

    @Builder.Default
    private boolean allowLate = true;

    private LocalDateTime lateDeadline;

    @Builder.Default
    private Integer latePenalty = 0; // percentage deduction per day/hour late

    @Builder.Default
    private String status = "PUBLISHED"; // DRAFT, PUBLISHED

    private Long organizationId;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
