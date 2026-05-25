package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_students",
       uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "student_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /**
     * true  = this student is in the "no recommend / excluded" list
     * false = this student is a normal invited participant
     */
    @Builder.Default
    private boolean unrecommended = false;
}
