package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "question_bank",
    indexes = {
        @Index(name = "idx_qbank_teacher", columnList = "teacher_id"),
        @Index(name = "idx_qbank_course", columnList = "course_id"),
        @Index(name = "idx_qbank_teach_course", columnList = "teacher_id, course_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionBank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String questionText;

    private String questionType; // MCQ, DESCRIPTIVE, TRUE_FALSE, FILL_IN_BLANKS

    @Column(columnDefinition = "LONGTEXT")
    private String optionsJson;

    @Column(columnDefinition = "LONGTEXT")
    private String correctAnswer;

    @Column(columnDefinition = "LONGTEXT")
    private String modelAnswer;

    private Double marks;

    private String difficulty; // EASY, MEDIUM, HARD

    private String imageUrl;
}
