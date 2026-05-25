package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.QuestionBank;
import com.zenelait.lms.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findByTeacher(Teacher teacher);
    List<QuestionBank> findByTeacherAndCourse(Teacher teacher, Course course);
}
