package com.zenelait.lms.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.util.Set;
import java.util.HashSet;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @ManyToMany(fetch = FetchType.EAGER)
	    @JoinTable(
	        name = "organization_features",
	        joinColumns = @JoinColumn(name = "organization_id"),
	        inverseJoinColumns = @JoinColumn(name = "feature_id")
	    )
	    @Builder.Default
	    private Set<Feature> features = new HashSet<>();

	    /** Auto-generated: ORG-2026-001 */
	    @Column(unique = true, nullable = false, length = 50)
	    private String orgCode;

	    @Column(nullable = false)
	    private String name;

	    @Column(unique = true, nullable = false)
	    private String email;

	    private String phone;
	    private String address;
	    private String city;
	    private String country;

	    @Column(length = 2000)
	    private String description;

	    @Column(nullable = false)
	    @Builder.Default
	    private boolean active = true;

	    @Column(nullable = false, updatable = false)
	    private LocalDateTime createdAt;

	    private LocalDateTime updatedAt;

	    @PrePersist
	    protected void onCreate() {
	        createdAt = LocalDateTime.now();
	        updatedAt  = LocalDateTime.now();
	    }

	    @PreUpdate
	    protected void onUpdate() {
	        updatedAt = LocalDateTime.now();
	    }
}
