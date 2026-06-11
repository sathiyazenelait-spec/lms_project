package com.zenelait.lms.repository;

import com.zenelait.lms.entity.LeaveDay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LeaveDayRepository extends JpaRepository<LeaveDay, Long> {
    Optional<LeaveDay> findByDate(LocalDate date);
    List<LeaveDay> findByDateBetween(LocalDate start, LocalDate end);
}
