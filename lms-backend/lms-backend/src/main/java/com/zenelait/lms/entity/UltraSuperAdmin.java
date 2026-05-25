package com.zenelait.lms.entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Entity
@Table(name = "ultra_super_admins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UltraSuperAdmin implements UserDetails{
	
	
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    /** Auto-generated: USA-2026-001 */
	    @Column(unique = true, nullable = false, length = 50)
	    private String userId;

	    @Column(nullable = false)
	    private String name;

	    @Column(unique = true, nullable = false)
	    private String email;

	    @Column(nullable = false)
	    private String password;

	    private String phone;

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

	    // ── UserDetails ──────────────────────────────────────────────────
	    @Override
	    public Collection<? extends GrantedAuthority> getAuthorities() {
	        return List.of(new SimpleGrantedAuthority("ROLE_ULTRA_SUPER_ADMIN"));
	    }

	    @Override public String getUsername()              { return email; }
	    @Override public boolean isAccountNonExpired()     { return true; }
	    @Override public boolean isAccountNonLocked()      { return true; }
	    @Override public boolean isCredentialsNonExpired() { return true; }
	    @Override public boolean isEnabled() { return active; }

}
