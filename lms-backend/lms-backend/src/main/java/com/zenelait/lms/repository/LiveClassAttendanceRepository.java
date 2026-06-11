package com.zenelait.lms.repository;

import com.zenelait.lms.entity.LiveClassAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LiveClassAttendanceRepository extends JpaRepository<LiveClassAttendance, Long> {
    List<LiveClassAttendance> findByMaterialId(Long materialId);
    Optional<LiveClassAttendance> findByMaterialIdAndStudentId(Long materialId, Long studentId);
}
