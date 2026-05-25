package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.Teacher;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByOrganizationId(Long organizationId);
    List<Course> findByTeacher(Teacher teacher);
    List<Course> findByTeacherAndOrganizationId(Teacher teacher, Long organizationId);
    List<Course> findByStatus(Course.CourseStatus status);

    // Org-scoped
    long countByOrganizationId(Long organizationId);
    List<Course> findByOrganizationIdAndStatus(Long organizationId, Course.CourseStatus status);


    /**
     * Directly query student_courses join table — bypasses Hibernate collection proxy.
     * This is the reliable way to get direct enrollments.
     */
    @Query(value = "SELECT c.* FROM courses c " +
                   "JOIN student_courses sc ON sc.course_id = c.id " +
                   "WHERE sc.student_id = :studentId",
           nativeQuery = true)
    List<Course> findDirectlyEnrolledByStudentId(@Param("studentId") Long studentId);
    
    @Query(value = """
    	    SELECT COUNT(*)
    	    FROM student_courses 
    	    WHERE student_id = :studentId 
    	    AND course_id = :courseId
    	""", nativeQuery = true)
    	Long existsStudentEnrollment(@Param("studentId") Long studentId,
    	                             @Param("courseId") Long courseId);
    
    @Modifying
    @Query(value = "DELETE FROM student_courses WHERE course_id = :courseId", nativeQuery = true)
    void removeAllStudentEnrollments(@Param("courseId") Long courseId);

    @Modifying
    @Query(value = "DELETE FROM batch_courses WHERE course_id = :courseId", nativeQuery = true)
    void removeAllBatchCourseLinks(@Param("courseId") Long courseId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO student_courses(student_id, course_id) VALUES (?1, ?2)", nativeQuery = true)
    void enrollStudent(Long studentId, Long courseId);
}
