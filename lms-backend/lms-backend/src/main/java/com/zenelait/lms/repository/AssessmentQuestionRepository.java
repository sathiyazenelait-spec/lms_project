package com.zenelait.lms.repository;

import com.zenelait.lms.entity.AssessmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {
    List<AssessmentQuestion> findByAssessmentId(Long assessmentId);
    void deleteByAssessmentId(Long assessmentId);
}
