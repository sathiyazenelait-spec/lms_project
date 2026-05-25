package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    // All posts for a course, newest first
    List<ForumPost> findByCourseOrderByCreatedAtDesc(Course course);

    // Count posts per course
    long countByCourse(Course course);

    // Posts by a specific course id
    @Query("SELECT p FROM ForumPost p WHERE p.course.id = :courseId ORDER BY p.createdAt DESC")
    List<ForumPost> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") Long courseId);
}
