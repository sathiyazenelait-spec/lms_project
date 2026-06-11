package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    
    @Cacheable(value = "students", key = "#email", unless = "#result == null")
    Optional<Student> findByEmail(String email);
    
    @Cacheable(value = "students", key = "#userId", unless = "#result == null")
    Optional<Student> findByUserId(String userId);
    
    boolean existsByEmail(String email);
    List<Student> findByDepartment(String department);
    long countByActive(boolean active);
    Optional<Student> findTopByOrderByIdDesc();
    
    List<Student> findByOrganizationId(Long organizationId);

    @Query("SELECT s FROM Student s WHERE MONTH(s.createdAt) = MONTH(CURRENT_DATE) AND YEAR(s.createdAt) = YEAR(CURRENT_DATE)")
    List<Student> getJoinThisMonthStudents();
    
    @Query("SELECT s FROM Student s WHERE s.organizationId = :orgId AND MONTH(s.createdAt) = MONTH(CURRENT_DATE) AND YEAR(s.createdAt) = YEAR(CURRENT_DATE)")
    List<Student> getJoinThisMonthStudentsByOrg(@Param("orgId") Long orgId); 
    
    @Query(value = """
    	    -- ✅ Direct enrolled students
    	    SELECT DISTINCT s.id, s.name, s.email, s.profile_pic_url
    	    FROM students s
    	    JOIN student_courses sc ON sc.student_id = s.id
    	    WHERE sc.course_id = :courseId

    	    UNION

    	    -- ✅ Batch students
    	    SELECT DISTINCT s.id, s.name, s.email, s.profile_pic_url
    	    FROM students s
    	    JOIN batch_students bs ON bs.student_id = s.id
    	    JOIN batch_courses bc ON bc.batch_id = bs.batch_id
    	    WHERE bc.course_id = :courseId

    	    UNION

    	    -- ✅ Legacy batch students
    	    SELECT DISTINCT s.id, s.name, s.email, s.profile_pic_url
    	    FROM students s
    	    JOIN batch_students bs ON bs.student_id = s.id
    	    JOIN batches b ON b.id = bs.batch_id
    	    WHERE b.course_id = :courseId
    	""", nativeQuery = true)
    	List<Object[]> findAllStudentsInCourse(@Param("courseId") Long courseId);
}
