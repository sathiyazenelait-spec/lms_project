package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meeting_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meeting_id", nullable = false)
    private Long meetingId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(nullable = false)
    private String optionType; // YES_NO, YES_NO_OTHER, CUSTOM

    @Column(columnDefinition = "TEXT")
    private String customOptions; // comma-separated options
}
