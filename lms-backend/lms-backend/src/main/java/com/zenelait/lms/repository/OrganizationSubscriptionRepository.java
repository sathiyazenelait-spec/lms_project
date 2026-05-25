package com.zenelait.lms.repository;

import com.zenelait.lms.entity.OrganizationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrganizationSubscriptionRepository extends JpaRepository<OrganizationSubscription, Long> {
    List<OrganizationSubscription> findByStatus(String status);
    Optional<OrganizationSubscription> findFirstByOrganizationIdOrderByEndDateDesc(Long organizationId);
}
