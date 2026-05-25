package com.zenelait.lms.repository;

import com.zenelait.lms.entity.RazorpayOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RazorpayOrderRepository extends JpaRepository<RazorpayOrder, String> {
    List<RazorpayOrder> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
