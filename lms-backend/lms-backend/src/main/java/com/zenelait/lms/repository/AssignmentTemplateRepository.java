package com.zenelait.lms.repository;

import com.zenelait.lms.entity.AssignmentTemplate;
import com.zenelait.lms.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentTemplateRepository extends JpaRepository<AssignmentTemplate, Long> {
    List<AssignmentTemplate> findByTeacher(Teacher teacher);
}
