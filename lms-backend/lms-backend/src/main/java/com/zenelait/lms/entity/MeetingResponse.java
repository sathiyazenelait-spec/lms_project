package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meeting_id", nullable = false)
    private Long meetingId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "user_id", nullable = false)
    private Long userId; // The Admin or Teacher's ID who responded

    @Column(nullable = false)
    private String answer;

    @Column(nullable = false)
    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        respondedAt = LocalDateTime.now();
    }
}
