package com.zenelait.lms.repository;

import com.zenelait.lms.entity.AdminCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminCertificateRepository extends JpaRepository<AdminCertificate, Long> {
    List<AdminCertificate> findByOrganizationIdOrderByIssueDateDesc(Long organizationId);
    List<AdminCertificate> findByRecipientTypeAndRecipientIdOrderByIssueDateDesc(String recipientType, Long recipientId);
}
