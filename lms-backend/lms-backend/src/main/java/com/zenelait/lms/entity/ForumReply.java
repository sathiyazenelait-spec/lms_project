package com.zenelait.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_replies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnoreProperties({"replies", "course", "postedByStudent", "postedByTeacher"})
    private ForumPost post;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked",
                           "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler"})
    private Student repliedByStudent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked",
                           "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler"})
    private Teacher repliedByTeacher;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    @Transient
    public String getAuthorName() {
        if (repliedByTeacher != null) return repliedByTeacher.getName() + " (Teacher)";
        if (repliedByStudent != null) return repliedByStudent.getName();
        return "Unknown";
    }

    @Transient
    public String getAuthorRole() {
        return repliedByTeacher != null ? "TEACHER" : "STUDENT";
    }
}
