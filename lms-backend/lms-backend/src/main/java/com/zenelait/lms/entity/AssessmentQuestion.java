package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(
    name = "assessment_questions",
    indexes = {
        @Index(name = "idx_q_assessment", columnList = "assessment_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String questionText;

    private String questionType; // MCQ, DESCRIPTIVE, TRUE_FALSE, FILL_IN_BLANKS

    @Column(columnDefinition = "LONGTEXT")
    private String optionsJson; // For MCQ: JSON array of string options

    @Column(columnDefinition = "LONGTEXT")
    private String correctAnswer; // For MCQ/True-False/FillBlank: correct option value or string

    @Column(columnDefinition = "LONGTEXT")
    private String modelAnswer; // For descriptive evaluation guidelines

    private Double marks;

    private String difficulty; // EASY, MEDIUM, HARD

    private String imageUrl;
}
