package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "assignment_submissions",
    indexes = {
        @Index(name = "idx_sub_student", columnList = "student_id"),
        @Index(name = "idx_sub_assignment", columnList = "assignment_id"),
        @Index(name = "idx_sub_stud_assign", columnList = "student_id, assignment_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentSubmission {

    public enum SubmissionStatus { SUBMITTED, GRADED, LATE, RESUBMISSION_REQUESTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(length = 10000)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String fileUrl;

    private String externalLink;

    @Column(columnDefinition = "LONGTEXT")
    private String studentNote;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    private Integer marksObtained;
    private String  teacherFeedback;

    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;

    @PrePersist
    protected void onCreate() { submittedAt = LocalDateTime.now(); }
    
    /**
     * Calculate grade as percentage (e.g., "85%") based on marksObtained and assignment maxMarks
     */
    public String getGrade() {
        if (this.marksObtained == null || this.assignment == null) {
            return null;
        }
        int maxMarks = this.assignment.getMaxMarks();
        if (maxMarks <= 0) {
            return null;
        }
        double percentage = (this.marksObtained * 100.0) / maxMarks;
        return String.format("%.1f%%", percentage);
    }
}
