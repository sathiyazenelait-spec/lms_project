package com.zenelait.lms.repository;

import com.zenelait.lms.entity.CourseMaterial;
import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseMaterialRepository extends JpaRepository<CourseMaterial, Long> {

    /** All visible materials for a course (student view) */
    List<CourseMaterial> findByCourseAndVisibleTrueOrderByCreatedAtDesc(Course course);

    /** All materials for a course regardless of visibility (teacher view) */
    List<CourseMaterial> findByCourseOrderByCreatedAtDesc(Course course);

    /** Materials uploaded by a specific teacher */
    List<CourseMaterial> findByUploadedByOrderByCreatedAtDesc(Teacher teacher);

    /** Materials by type for a course */
    List<CourseMaterial> findByCourseAndTypeAndVisibleTrue(
            Course course, CourseMaterial.MaterialType type);
}
