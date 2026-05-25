package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    public enum ExamStatus {
        UPCOMING, CURRENT, POSTPONED, RESCHEDULED, COMPLETED, EVALUATING, CANCELLED
    }

    public enum ExamType {
        MIDTERM, FINAL, UNIT_TEST, PRACTICAL, QUIZ, OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExamType examType = ExamType.OTHER;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    private String department;
    private String batchName;
    private Long   batchId;

    /** When the exam is scheduled to start */
    private LocalDateTime scheduledAt;

    /** Duration in minutes */
    private Integer durationMinutes;

    /** Maximum marks */
    @Builder.Default
    private Integer maxMarks = 100;

    /** Minimum marks to pass */
    @Builder.Default
    private Integer passMarks = 40;

    /** "Level-up" score threshold (for grade banding) */
    private Integer levelUpScore;

    /** Below-this = fail (cleanup score) */
    private Integer cleanupScore;

    /** Optional question paper URL */
    @Column(columnDefinition = "LONGTEXT")
    private String questionPaperUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExamStatus status = ExamStatus.UPCOMING;

    /** Set when teacher postpones — new scheduled date */
    private LocalDateTime postponedTo;

    /** Reason when cancelled */
    @Column(length = 2000)
    private String cancellationReason;

    /** For rescheduled exams: which original exam this cloned from */
    private Long rescheduledFromId;

    /** Whether all students or only selected students */
    @Builder.Default
    private boolean allStudents = true;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
