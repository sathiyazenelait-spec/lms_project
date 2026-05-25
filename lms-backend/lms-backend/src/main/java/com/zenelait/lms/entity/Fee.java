package com.zenelait.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fee {

    public enum FeeStatus { PENDING, PAID, OVERDUE }
    public enum FeeType   { TUITION, EXAM, LAB, LIBRARY, TRANSPORT, MISCELLANEOUS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked",
                           "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler"})
    private Student student;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "fee_type")
    private FeeType feeType;

    private String department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    @JsonIgnoreProperties({"students", "hibernateLazyInitializer", "handler"})
    private Batch batch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id")
    @JsonIgnoreProperties({"teacher", "hibernateLazyInitializer", "handler"})
    private Course course;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(precision = 10, scale = 2)
    private BigDecimal paidAmount;

    @Column(nullable = false)
    private LocalDate dueDate;

    private LocalDate paidDate;

    @Enumerated(EnumType.STRING)
    private FeeStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.status  == null) this.status  = FeeStatus.PENDING;
        if (this.feeType == null) this.feeType = FeeType.TUITION;
        createdAt = LocalDateTime.now();
    }
}
