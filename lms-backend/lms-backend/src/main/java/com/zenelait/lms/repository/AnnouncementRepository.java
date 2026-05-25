package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Announcement;
import com.zenelait.lms.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("SELECT a FROM Announcement a WHERE a.targetRole = :role OR a.targetRole IS NULL ORDER BY a.createdAt DESC")
    List<Announcement> findByRoleOrGlobal(@Param("role") Role role);

    @Query("SELECT a FROM Announcement a WHERE a.organizationId = :orgId AND (a.targetRole = :role OR a.targetRole IS NULL) ORDER BY a.createdAt DESC")
    List<Announcement> findByOrganizationIdAndRoleOrGlobal(@Param("orgId") Long orgId, @Param("role") Role role);

    @Query("SELECT a FROM Announcement a WHERE a.organizationId = :orgId AND (a.targetRole = :role OR a.targetRole IS NULL OR a.courseId IN :courseIds) ORDER BY a.createdAt DESC")
    List<Announcement> findByOrganizationIdAndRoleOrGlobalOrCourseIds(
            @Param("orgId") Long orgId,
            @Param("role") Role role,
            @Param("courseIds") List<Long> courseIds);
}
