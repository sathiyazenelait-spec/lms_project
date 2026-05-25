package com.zenelait.lms.repository;
 
import com.zenelait.lms.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
 
import java.util.List;
import java.util.Optional;
 
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Department> findByActiveTrue();
    List<Department>findByOrganizationId(Long organizationId);
    Optional<Department> findByNameIgnoreCaseAndOrganizationId(String name, Long organizationId);
}