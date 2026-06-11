package com.zenelait.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_materials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseMaterial {

    public enum MaterialType { NOTE, VIDEO, MEET_LINK }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked",
            "credentialsNonExpired","enabled","enrolledStudents","enrolledCourses","hibernateLazyInitializer"})
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked",
            "credentialsNonExpired","enabled","hibernateLazyInitializer"})
    private Teacher uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialType type;         // NOTE | VIDEO | MEET_LINK

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    // For NOTE: base64 or plain text content
    // For VIDEO: YouTube/Drive URL or base64 video data URL
    // For MEET_LINK: the meet URL
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    // For VIDEO: optional thumbnail URL
    private String thumbnailUrl;

    // For MEET_LINK: scheduled date/time
    private LocalDateTime scheduledAt;

    // Live Class Configurations
    private String joinType;        // EXTERNAL | EMBEDDED
    private String platformType;    // ZOOM | MEET | TEAMS | OTHER
    @Builder.Default
    private boolean meetingStarted = false;
    private LocalDateTime meetingStartedAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean visible = true;    // teacher can hide/show

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.visible) this.visible = true;
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
