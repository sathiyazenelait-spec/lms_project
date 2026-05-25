package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Parent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParentRepository extends JpaRepository<Parent, Long> {
    Optional<Parent> findByEmail(String email);
    Optional<Parent> findByUserId(String userId);
    boolean existsByEmail(String email);
    List<Parent> findByOrganizationId(Long orgId);
    Optional<Parent> findTopByOrderByIdDesc();
}
