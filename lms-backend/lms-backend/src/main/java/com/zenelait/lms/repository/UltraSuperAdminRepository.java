package com.zenelait.lms.repository;

import com.zenelait.lms.entity.UltraSuperAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UltraSuperAdminRepository extends JpaRepository<UltraSuperAdmin, Long> {

    Optional<UltraSuperAdmin> findByEmail(String email);
    Optional<UltraSuperAdmin> findByUserId(String userId);
    boolean existsByEmail(String email);

    @Query("SELECT u.userId FROM UltraSuperAdmin u WHERE u.userId LIKE :prefix% ORDER BY u.userId DESC LIMIT 1")
    Optional<String> findLastUserIdByPrefix(@Param("prefix") String prefix);
}
