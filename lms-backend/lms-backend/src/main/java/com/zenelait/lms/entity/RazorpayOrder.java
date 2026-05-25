package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "razorpay_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrder {

    @Id
    @Column(name = "order_id", length = 100)
    private String orderId;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, SUCCESS, FAILED

    /** Organization this payment belongs to (null = legacy) */
    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
