package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meeting_id", nullable = false)
    private Long meetingId;

    @Column(nullable = false)
    private String participantType; // ADMIN, TEACHER

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    private Boolean attended; // null (unmarked), true (present), false (absent)

    private LocalDateTime checkInTime;
}
