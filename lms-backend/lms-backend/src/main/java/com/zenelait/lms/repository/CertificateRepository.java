package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByStudentIdOrderByIssueDateDesc(Long studentId);

    List<Certificate> findByTeacherIdOrderByIssueDateDesc(Long teacherId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
}
