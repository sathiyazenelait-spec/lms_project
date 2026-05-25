package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByOrganizationId(Long organizationId);

    @Query("SELECT m FROM Meeting m WHERE m.organizationId = :orgId AND m.status != 'CANCELLED' " +
           "AND ((m.startDate < :end AND m.endDate > :start) OR (m.type = 'OPINION' AND m.deadline > :start AND m.deadline < :end))")
    List<Meeting> findOverlappingMeetings(@Param("orgId") Long orgId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Meeting> findByStatusAndReminderSentFalse(String status);

    List<Meeting> findByTypeAndStatusAndDeadlineReminderSentFalse(String type, String status);

    List<Meeting> findByStatus(String status);
}
