package com.zenelait.lms.repository;

import com.zenelait.lms.entity.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {
    List<MeetingParticipant> findByMeetingId(Long meetingId);
    List<MeetingParticipant> findByParticipantTypeAndUserId(String type, Long userId);
    Optional<MeetingParticipant> findByMeetingIdAndParticipantTypeAndUserId(Long meetingId, String type, Long userId);
    void deleteByMeetingId(Long meetingId);
}
