package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "batches", indexes = {
    @Index(name = "idx_batch_org_id", columnList = "organization_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Batch {

    public enum BatchStatus { UPCOMING, ACTIVE, COMPLETED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String department;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BatchStatus status = BatchStatus.UPCOMING;
    
    /** Organization this batch belongs to */
    @Column(name = "organization_id")
    private Long organizationId;

    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "batch_students",
        joinColumns = @JoinColumn(name = "batch_id"),
        inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    @Builder.Default
    private Set<Student> students = new HashSet<>();

    /**
     * Many-to-many: a batch has MANY courses (subjects).
     * e.g. 2026_BIO_A1 → Tamil, English, Maths, Biology, Chemistry, Physics
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "batch_courses",
        joinColumns = @JoinColumn(name = "batch_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    @Builder.Default
    @JsonIgnore
    private Set<Course> courses = new HashSet<>();

    /**
     * Legacy single course FK — kept for backward compatibility.
     * Use the batch_courses table for new code.
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_teacher_id")
    private Teacher classTeacher;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
