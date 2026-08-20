package com.zenelait.lms.repository;

import com.zenelait.lms.entity.ForgotPasswordRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForgotPasswordRequestRepository extends JpaRepository<ForgotPasswordRequest, Long> {
    List<ForgotPasswordRequest> findByTargetAndStatus(String target, String status);
    List<ForgotPasswordRequest> findByTargetAndOrganizationIdAndStatus(String target, Long organizationId, String status);
    
    Optional<ForgotPasswordRequest> findFirstByEmailAndRoleAndStatusOrderByCreatedAtDesc(String email, String role, String status);
    
    @Transactional
    void deleteByEmailAndRole(String email, String role);
}
