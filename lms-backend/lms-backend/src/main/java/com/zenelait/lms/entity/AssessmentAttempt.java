package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "assessment_attempts",
    indexes = {
        @Index(name = "idx_attempt_student", columnList = "student_id"),
        @Index(name = "idx_attempt_assessment", columnList = "assessment_id"),
        @Index(name = "idx_attempt_stud_assess", columnList = "student_id, assessment_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;

    @Builder.Default
    private String status = "IN_PROGRESS"; // IN_PROGRESS, SUBMITTED, GRADED, MISSED

    private Double totalScore;

    @Builder.Default
    private Integer tabSwitchCount = 0;

    private LocalDateTime gradedAt;

    @Column(columnDefinition = "LONGTEXT")
    private String feedback;

    @Builder.Default
    private boolean resultsPublished = false;
}
