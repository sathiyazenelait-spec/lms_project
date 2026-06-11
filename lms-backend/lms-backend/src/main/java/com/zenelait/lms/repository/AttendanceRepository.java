package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Attendance;
import com.zenelait.lms.entity.Course;
import com.zenelait.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentAndCourse(Student student, Course course);
    List<Attendance> findByCourseAndDate(Course course, LocalDate date);
    java.util.Optional<Attendance> findByStudentAndCourseAndDate(Student student, Course course, LocalDate date);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student = :student AND a.course = :course AND a.status = 'PRESENT'")
    long countPresentByStudentAndCourse(@Param("student") Student student, @Param("course") Course course);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student = :student AND a.course = :course")
    long countTotalByStudentAndCourse(@Param("student") Student student, @Param("course") Course course);
    
    List<Attendance> findByCourseId(Long courseId);
    
    List<Attendance> findByStudentId(Long studentId);

    // Or, if you want to use studentId
    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId")
    List<Attendance> getAttendanceByStudent(@Param("studentId") Long studentId);
}
