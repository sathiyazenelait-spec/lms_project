package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    Optional<Organization> findByEmail(String email);
    Optional<Organization> findByOrgCode(String orgCode);
    boolean existsByEmail(String email);
    Optional<Organization> findByName(String name);
    List<Organization> findByActiveTrue();

    @Query("SELECT o.orgCode FROM Organization o WHERE o.orgCode LIKE :prefix% ORDER BY o.orgCode DESC LIMIT 1")
    Optional<String> findLastOrgCodeByPrefix(@Param("prefix") String prefix);
}
