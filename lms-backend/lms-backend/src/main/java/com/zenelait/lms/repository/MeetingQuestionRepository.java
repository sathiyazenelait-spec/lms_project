package com.zenelait.lms.repository;

import com.zenelait.lms.entity.MeetingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingQuestionRepository extends JpaRepository<MeetingQuestion, Long> {
    List<MeetingQuestion> findByMeetingId(Long meetingId);
    void deleteByMeetingId(Long meetingId);
}
