package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Fee;
import com.zenelait.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FeeRepository extends JpaRepository<Fee, Long> {
    List<Fee> findByStudent(Student student);
    List<Fee> findByStatus(Fee.FeeStatus status);

    // ── Global queries (no org filter) ────────────────────────────────
    @Query("SELECT f FROM Fee f WHERE f.status = 'PAID' " +
            "AND MONTH(f.paidDate) = MONTH(CURRENT_DATE) " +
            "AND YEAR(f.paidDate) = YEAR(CURRENT_DATE)")
    List<Fee> findPaidFeesThisMonth();

    @Query("SELECT COALESCE(SUM(f.paidAmount), 0) FROM Fee f WHERE f.status = 'PAID' " +
            "AND MONTH(f.paidDate) = MONTH(CURRENT_DATE) " +
            "AND YEAR(f.paidDate) = YEAR(CURRENT_DATE)")
    BigDecimal getTotalRevenueThisMonth();

    @Query("SELECT MONTH(f.paidDate), COALESCE(SUM(f.paidAmount), 0) " +
               "FROM Fee f WHERE f.status = 'PAID' " +
               "AND f.paidDate >= :sixMonthsAgo " +
               "GROUP BY MONTH(f.paidDate) ORDER BY MONTH(f.paidDate)")
    List<Object[]> getMonthlyRevenue(@Param("sixMonthsAgo") LocalDate sixMonthsAgo);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fee f " +
                   "WHERE f.status != 'PAID' " +
                   "AND MONTH(f.dueDate) = MONTH(CURRENT_DATE) " +
                   "AND YEAR(f.dueDate) = YEAR(CURRENT_DATE)")
    BigDecimal getTotalPendingAmount();

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fee f " +
                   "WHERE MONTH(f.dueDate) = MONTH(CURRENT_DATE) " +
                   "AND YEAR(f.dueDate) = YEAR(CURRENT_DATE)")
    BigDecimal getTotalBilledAmount();

    // ── Org-scoped queries ────────────────────────────────────────────
    @Query("SELECT f FROM Fee f WHERE f.student.organizationId = :orgId")
    List<Fee> findByStudentOrganizationId(@Param("orgId") Long orgId);

    @Query("SELECT f FROM Fee f WHERE f.student.organizationId = :orgId AND f.status = :status")
    List<Fee> findByStudentOrganizationIdAndStatus(@Param("orgId") Long orgId,
                                                    @Param("status") Fee.FeeStatus status);

    @Query("SELECT f FROM Fee f WHERE f.student.organizationId = :orgId " +
           "AND f.status = 'PAID' " +
           "AND MONTH(f.paidDate) = MONTH(CURRENT_DATE) " +
           "AND YEAR(f.paidDate) = YEAR(CURRENT_DATE)")
    List<Fee> findPaidFeesThisMonthByOrg(@Param("orgId") Long orgId);

    @Query("SELECT COALESCE(SUM(f.paidAmount), 0) FROM Fee f " +
           "WHERE f.student.organizationId = :orgId " +
           "AND f.status = 'PAID' " +
           "AND MONTH(f.paidDate) = MONTH(CURRENT_DATE) " +
           "AND YEAR(f.paidDate) = YEAR(CURRENT_DATE)")
    BigDecimal getTotalRevenueThisMonthByOrg(@Param("orgId") Long orgId);

    @Query("SELECT MONTH(f.paidDate), COALESCE(SUM(f.paidAmount), 0) " +
           "FROM Fee f WHERE f.student.organizationId = :orgId " +
           "AND f.status = 'PAID' " +
           "AND f.paidDate >= :sixMonthsAgo " +
           "GROUP BY MONTH(f.paidDate) ORDER BY MONTH(f.paidDate)")
    List<Object[]> getMonthlyRevenueByOrg(@Param("orgId") Long orgId,
                                           @Param("sixMonthsAgo") LocalDate sixMonthsAgo);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fee f " +
           "WHERE f.student.organizationId = :orgId " +
           "AND f.status != 'PAID' " +
           "AND MONTH(f.dueDate) = MONTH(CURRENT_DATE) " +
           "AND YEAR(f.dueDate) = YEAR(CURRENT_DATE)")
    BigDecimal getTotalPendingAmountByOrg(@Param("orgId") Long orgId);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fee f " +
           "WHERE f.student.organizationId = :orgId " +
           "AND MONTH(f.dueDate) = MONTH(CURRENT_DATE) " +
           "AND YEAR(f.dueDate) = YEAR(CURRENT_DATE)")
    BigDecimal getTotalBilledAmountByOrg(@Param("orgId") Long orgId);
}

