package com.zenelait.lms.repository;

import com.zenelait.lms.entity.MeetingResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingResponseRepository extends JpaRepository<MeetingResponse, Long> {
    List<MeetingResponse> findByMeetingId(Long meetingId);
    List<MeetingResponse> findByMeetingIdAndUserId(Long meetingId, Long userId);
    Optional<MeetingResponse> findByMeetingIdAndQuestionIdAndUserId(Long meetingId, Long questionId, Long userId);
    void deleteByMeetingId(Long meetingId);
}
