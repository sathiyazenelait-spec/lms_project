package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByEmail(String email);
    
    
    @Query("SELECT a FROM Admin a WHERE a.userId = :userId AND a.superAdmin = true")
    Optional<Admin> findBySuperAdminUserId(@Param("userId") String userId);
    
    List<Admin> findBySuperAdminFalse();
    
    /** All admins (Super + regular) within a specific organization */
    List<Admin> findByOrganizationId(Long organizationId);
    
    /** Regular admins within a specific organization */
    List<Admin> findByOrganizationIdAndSuperAdminFalse(Long organizationId);
    
  
    /** All Super Admins (platform-wide) */
    List<Admin> findBySuperAdminTrue();
    
    
    /** Super admins within a specific organization */
    List<Admin> findByOrganizationIdAndSuperAdminTrue(Long organizationId);

    Optional<Admin> findByUserId(String userId);
    boolean existsByEmail(String email);
    @Query("SELECT a.userId FROM Admin a WHERE a.userId LIKE :prefix% ORDER BY a.userId DESC LIMIT 1")
    Optional<String> findLastUserIdByPrefix(@Param("prefix") String prefix);
}
