package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Assignment;
import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourse(Course course);
    List<Assignment> findByTeacher(Teacher teacher);
}
