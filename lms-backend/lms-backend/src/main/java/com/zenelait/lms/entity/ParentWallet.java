package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "parent_wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParentWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "parent_id", unique = true, nullable = false)
    private Parent parent;

    @Column(nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double balance = 0.0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(length = 500)
    private String notes;

    @Column(length = 100)
    private String lastTransactionId;

    /**
     * Add balance to wallet
     */
    public void addBalance(Double amount) {
        if (amount > 0) {
            this.balance += amount;
            this.updatedAt = LocalDateTime.now();
        }
    }

    /**
     * Deduct balance from wallet
     */
    public boolean deductBalance(Double amount) {
        if (amount > 0 && this.balance >= amount) {
            this.balance -= amount;
            this.updatedAt = LocalDateTime.now();
            return true;
        }
        return false;
    }

    /**
     * Check if sufficient balance
     */
    public boolean hasSufficientBalance(Double amount) {
        return this.balance >= amount;
    }
}
