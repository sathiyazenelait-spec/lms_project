package com.zenelait.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "courses", indexes = {
    @Index(name = "idx_course_org_id", columnList = "organization_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    public enum CourseStatus { ACTIVE, INACTIVE, DRAFT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    private String department;
    private int    durationHours;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired",
                           "accountNonLocked", "credentialsNonExpired",
                           "enabled", "courses", "hibernateLazyInitializer"})
    private Teacher teacher;

    // ── Students directly enrolled in this course (no batch needed) ───────────
    @JsonIgnore  // Fetched separately via /admin/courses/{id}/students
    @ManyToMany(mappedBy = "enrolledCourses", fetch = FetchType.LAZY)
    private Set<Student> enrolledStudents = new HashSet<>();

    @Enumerated(EnumType.STRING)
    private CourseStatus status;
    
    /** Organization this course belongs to */
    @Column(name = "organization_id")
    private Long organizationId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) this.status = CourseStatus.DRAFT;
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.status == null) this.status = CourseStatus.DRAFT;
        updatedAt = LocalDateTime.now();
    }
}
