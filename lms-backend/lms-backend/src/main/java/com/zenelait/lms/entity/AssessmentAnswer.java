package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(
    name = "assessment_answers",
    indexes = {
        @Index(name = "idx_ans_attempt", columnList = "attempt_id"),
        @Index(name = "idx_ans_question", columnList = "question_id"),
        @Index(name = "idx_ans_attempt_quest", columnList = "attempt_id, question_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private AssessmentAttempt attempt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    private AssessmentQuestion question;

    @Column(columnDefinition = "LONGTEXT")
    private String studentAnswer;

    private Double marksObtained;

    @Column(columnDefinition = "LONGTEXT")
    private String teacherFeedback;

    @Builder.Default
    private boolean flagged = false;
}
