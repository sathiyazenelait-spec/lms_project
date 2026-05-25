package com.zenelait.lms.repository;

import com.zenelait.lms.entity.MeetingAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingAuditLogRepository extends JpaRepository<MeetingAuditLog, Long> {
    List<MeetingAuditLog> findByMeetingId(Long meetingId);
}
