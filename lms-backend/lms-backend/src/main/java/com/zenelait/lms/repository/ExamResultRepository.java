package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Exam;
import com.zenelait.lms.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByExam(Exam exam);
    List<ExamResult> findByExamId(Long examId);
    void deleteByExamId(Long examId);
    List<ExamResult> findByStudentId(Long studentId);
}
