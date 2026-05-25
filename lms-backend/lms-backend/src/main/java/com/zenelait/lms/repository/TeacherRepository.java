package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Student;
import com.zenelait.lms.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByEmail(String email);
    Optional<Teacher> findByUserId(String userId);
    boolean existsByEmail(String email);
    List<Teacher> findByDepartment(String department); 
    List<Teacher> findByOrganizationId(Long orgId);
    Optional<Teacher> findTopByOrderByIdDesc();
}
