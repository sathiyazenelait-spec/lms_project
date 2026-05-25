package com.zenelait.lms.repository;

import com.zenelait.lms.entity.ContactMsg;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactMessageRepository extends JpaRepository<ContactMsg, Long> {
    // Global (legacy / no org filter)
    List<ContactMsg> findAllByOrderByReceivedAtDesc();
    List<ContactMsg> findByStatus(ContactMsg.MessageStatus status);
    long countByStatus(ContactMsg.MessageStatus status);

    // Org-scoped
    List<ContactMsg> findByOrganizationIdOrderByReceivedAtDesc(Long organizationId);
    List<ContactMsg> findByOrganizationIdAndStatus(Long organizationId, ContactMsg.MessageStatus status);
    long countByOrganizationIdAndStatus(Long organizationId, ContactMsg.MessageStatus status);
}
