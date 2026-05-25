package com.zenelait.lms.repository;

import com.zenelait.lms.entity.TeacherReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TeacherReviewRepository extends JpaRepository<TeacherReview, Long> {

    List<TeacherReview> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    @Query("SELECT AVG(r.rating) FROM TeacherReview r WHERE r.teacher.id = :teacherId")
    Double getAverageRatingForTeacher(@Param("teacherId") Long teacherId);

    @Query("SELECT COUNT(r) FROM TeacherReview r WHERE r.teacher.id = :teacherId")
    Long countReviewsForTeacher(@Param("teacherId") Long teacherId);

    boolean existsByStudentIdAndTeacherId(Long studentId, Long teacherId);
}
