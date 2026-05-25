package com.zenelait.lms.repository;

import com.zenelait.lms.entity.CourseEnrollmentRequest;
import com.zenelait.lms.entity.CourseEnrollmentRequest.EnrollmentRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRequestRepository extends JpaRepository<CourseEnrollmentRequest, Long> {
    List<CourseEnrollmentRequest> findByStudentId(Long studentId);
    List<CourseEnrollmentRequest> findByOrganizationIdAndStatus(Long orgId, EnrollmentRequestStatus status);
    List<CourseEnrollmentRequest> findByOrganizationId(Long orgId);
    Optional<CourseEnrollmentRequest> findByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, EnrollmentRequestStatus status);
    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, EnrollmentRequestStatus status);
}
