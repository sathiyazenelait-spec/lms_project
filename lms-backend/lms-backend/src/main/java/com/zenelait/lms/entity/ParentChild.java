package com.zenelait.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parent_child")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentChild {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_id", nullable = false)
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked",
                           "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler"})
    private Parent parent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "child_id", nullable = false)
    @JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked",
                           "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler"})
    private Student child;
}
