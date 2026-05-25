package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "assessments",
    indexes = {
        @Index(name = "idx_assess_course", columnList = "course_id"),
        @Index(name = "idx_assess_teacher", columnList = "teacher_id"),
        @Index(name = "idx_assess_org", columnList = "organizationId")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    private String assessmentType; // MCQ, DESCRIPTIVE, MIXED, TRUE_FALSE, FILL_IN_BLANKS

    private Double totalMarks;
    private Double passMarks;
    private Integer durationMinutes;

    @Column(columnDefinition = "LONGTEXT")
    private String instructions;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @Builder.Default
    private boolean shuffleQuestions = false;

    @Builder.Default
    private boolean showResultImmediately = true;

    @Builder.Default
    private String status = "DRAFT"; // DRAFT, PUBLISHED

    @Column(columnDefinition = "LONGTEXT")
    private String assignedStudentIds; // comma-separated or json array of student IDs (optional)

    private Long organizationId;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
