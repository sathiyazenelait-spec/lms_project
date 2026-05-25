package com.zenelait.lms.repository;

import com.zenelait.lms.entity.AssessmentAttempt;
import com.zenelait.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {
    List<AssessmentAttempt> findByAssessmentId(Long assessmentId);
    List<AssessmentAttempt> findByStudent(Student student);
    Optional<AssessmentAttempt> findByAssessmentIdAndStudent(Long assessmentId, Student student);
}
