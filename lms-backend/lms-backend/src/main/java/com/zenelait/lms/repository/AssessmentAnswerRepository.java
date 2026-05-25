package com.zenelait.lms.repository;

import com.zenelait.lms.entity.AssessmentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssessmentAnswerRepository extends JpaRepository<AssessmentAnswer, Long> {
    List<AssessmentAnswer> findByAttemptId(Long attemptId);
    void deleteByAttemptId(Long attemptId);
}
