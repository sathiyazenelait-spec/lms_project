package com.zenelait.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "forum_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Which course this post belongs to ─────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"teacher", "hibernateLazyInitializer", "handler"})
    private Course course;

    // ── Who posted (student or teacher — only one will be non-null) ────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked",
                           "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler"})
    private Student postedByStudent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked",
                           "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler"})
    private Teacher postedByTeacher;

    // ── Content ───────────────────────────────────────────────────────────────
    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType type;

    public enum PostType { QUESTION, DISCUSSION, ANNOUNCEMENT }

    // ── Replies ───────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    @JsonIgnoreProperties("post")
    private List<ForumReply> replies = new ArrayList<>();

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    // ── Helper: who posted ────────────────────────────────────────────────────
    @Transient
    public String getAuthorName() {
        if (postedByTeacher != null) return postedByTeacher.getName() + " (Teacher)";
        if (postedByStudent != null) return postedByStudent.getName();
        return "Unknown";
    }

    @Transient
    public String getAuthorRole() {
        return postedByTeacher != null ? "TEACHER" : "STUDENT";
    }
}
