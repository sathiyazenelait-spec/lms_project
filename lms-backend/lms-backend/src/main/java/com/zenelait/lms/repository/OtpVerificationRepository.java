package com.zenelait.lms.repository;

import com.zenelait.lms.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findByEmailAndRoleAndOtp(String email, String role, String otp);
    
    @Transactional
    void deleteByEmailAndRole(String email, String role);
    
    @Transactional
    void deleteByExpiryTimeBefore(LocalDateTime time);
}
