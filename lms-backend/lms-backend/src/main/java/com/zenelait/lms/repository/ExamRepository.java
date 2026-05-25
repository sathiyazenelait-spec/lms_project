package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Exam;
import com.zenelait.lms.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByTeacher(Teacher teacher);
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByTeacherAndCourseId(Teacher teacher, Long courseId);
    List<Exam> findByRescheduledFromId(Long originalId);
}
