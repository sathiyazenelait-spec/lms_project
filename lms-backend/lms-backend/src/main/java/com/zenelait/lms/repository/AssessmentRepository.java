package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Assessment;
import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByCourse(Course course);
    List<Assessment> findByTeacher(Teacher teacher);
    List<Assessment> findByTeacherAndCourseId(Teacher teacher, Long courseId);
}
