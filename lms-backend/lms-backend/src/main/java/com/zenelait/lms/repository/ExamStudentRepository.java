package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Exam;
import com.zenelait.lms.entity.ExamStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamStudentRepository extends JpaRepository<ExamStudent, Long> {
    List<ExamStudent> findByExam(Exam exam);
    List<ExamStudent> findByExamId(Long examId);
    void deleteByExamId(Long examId);
    List<ExamStudent> findByStudentId(Long studentId);
}
