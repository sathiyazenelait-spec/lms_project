package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Batch;
import com.zenelait.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findByOrganizationId(Long organizationId);
    List<Batch> findByDepartment(String department);
    List<Batch> findByStatus(Batch.BatchStatus status);

    // Org-scoped
    long countByOrganizationId(Long organizationId);
    List<Batch> findByOrganizationIdAndStatus(Long organizationId, Batch.BatchStatus status);


    /** All batches a specific student belongs to */
    @Query("SELECT b FROM Batch b JOIN b.students s WHERE s.id = :studentId")
    List<Batch> findByStudentId(@Param("studentId") Long studentId);

    /** Check if student is in ANY batch whose date range overlaps [start, end] */
    @Query("""
        SELECT COUNT(b) > 0 FROM Batch b JOIN b.students s
        WHERE s.id = :studentId
          AND b.startDate <= :endDate
          AND b.endDate   >= :startDate
    """)
    boolean studentHasOverlappingBatch(
            @Param("studentId") Long studentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate);
    
    @Query(value = """
    	    SELECT COUNT(*)
    	    FROM batch_students bs
    	    JOIN batch_courses bc ON bs.batch_id = bc.batch_id
    	    WHERE bs.student_id = :studentId
    	    AND bc.course_id = :courseId
    	""", nativeQuery = true)
    	Long existsStudentInCourse(@Param("studentId") Long studentId,
    	                           @Param("courseId") Long courseId);
    
    @Query("""
    	    SELECT b.startDate, b.endDate
    	    FROM Batch b
    	    JOIN b.courses c
    	    WHERE c.id = :courseId
    	""")
    	List<Object[]> findBatchDatesByCourseId(@Param("courseId") Long courseId);
}

