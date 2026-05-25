package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Batch;
import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.Teacher;
import com.zenelait.lms.entity.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;

public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, Long> {
    List<TimetableSlot> findByTeacher(Teacher teacher);
    List<TimetableSlot> findByCourse(Course course);
    List<TimetableSlot> findByBatch(Batch batch);

    // Only return slots for batches whose status is ACTIVE (global)
    @Query("SELECT t FROM TimetableSlot t WHERE t.batch IS NOT NULL AND t.batch.status = 'ACTIVE'")
    List<TimetableSlot> findAllActiveBatchSlots();

    // Org-scoped: only active-batch slots for a given organization
    @Query("SELECT t FROM TimetableSlot t WHERE t.batch IS NOT NULL AND t.batch.status = 'ACTIVE' AND t.batch.organizationId = :orgId")
    List<TimetableSlot> findAllActiveBatchSlotsByOrgId(@Param("orgId") Long orgId);

    // Check: same course, same day, same batch — prevents duplicate
    @Query("SELECT COUNT(t) > 0 FROM TimetableSlot t WHERE t.batch.id = :batchId AND t.course.id = :courseId AND t.dayOfWeek = :day AND t.id <> :excludeId")
    boolean courseExistsOnDayForBatch(@Param("batchId") Long batchId,
                                       @Param("courseId") Long courseId,
                                       @Param("day") String day,
                                       @Param("excludeId") Long excludeId);
    
    @Query("""
    		SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END
    		FROM TimetableSlot t
    		WHERE t.batch.id = :batchId
    		AND t.dayOfWeek = :day
    		AND (
    		    (:startTime < t.endTime AND :endTime > t.startTime)
    		)
    		""")
    		boolean existsTimeOverlap(Long batchId, String day, LocalTime startTime, LocalTime endTime);
    
    @Query("""
    		SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END
    		FROM TimetableSlot t
    		WHERE t.batch.id = :batchId
    		AND t.dayOfWeek = :day
    		AND t.id <> :excludeId
    		AND (
    		    (:startTime < t.endTime AND :endTime > t.startTime)
    		)
    		""")
    		boolean existsTimeOverlapExcludingId(
    		        @Param("batchId") Long batchId,
    		        @Param("day") String day,
    		        @Param("startTime") LocalTime startTime,
    		        @Param("endTime") LocalTime endTime,
    		        @Param("excludeId") Long excludeId
    		);
    @Query("""
    		SELECT MAX(t.endTime) FROM TimetableSlot t
    		WHERE t.batch.id = :batchId AND t.dayOfWeek = :day
    		""")
    		LocalTime findLastEndTime(@Param("batchId") Long batchId,
    		                          @Param("day") String day);
    
    @Query("""
    	    SELECT t.id FROM TimetableSlot t
    	    WHERE t.batch.id = :batchId AND t.dayOfWeek = :day
    	    ORDER BY t.endTime DESC
    	""")
    	List<Long> findLastSlotIds(Long batchId, String day);
}
