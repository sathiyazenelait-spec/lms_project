package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results",
       uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "student_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private Integer marksObtained;
    private String  grade;

    /** Whether the student attended the exam */
    @Builder.Default
    private boolean attended = true;

    /** Whether the student passed */
    @Builder.Default
    private boolean cleared = false;

    private LocalDateTime gradedAt;

    @PrePersist
    protected void onCreate() { gradedAt = LocalDateTime.now(); }
}
