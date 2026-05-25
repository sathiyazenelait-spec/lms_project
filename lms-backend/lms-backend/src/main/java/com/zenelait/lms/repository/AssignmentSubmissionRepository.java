package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Assignment;
import com.zenelait.lms.entity.AssignmentSubmission;
import com.zenelait.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    List<AssignmentSubmission> findByAssignment(Assignment assignment);
    List<AssignmentSubmission> findByStudent(Student student);
    Optional<AssignmentSubmission> findByAssignmentAndStudent(Assignment assignment, Student student);
    
    @Query("""
    	    SELECT COUNT(s) > 0
    	    FROM AssignmentSubmission s
    	    WHERE s.assignment = :assignment
    	    AND s.student = :student
    	""")
    	boolean existsByAssignmentAndStudent(@Param("assignment") Assignment assignment,
    	                                     @Param("student") Student student);
}
