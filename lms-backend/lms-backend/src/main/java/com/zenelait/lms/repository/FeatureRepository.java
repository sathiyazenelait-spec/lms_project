package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Feature;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FeatureRepository extends JpaRepository<Feature, Long> {
    Optional<Feature> findByFeatureKey(String featureKey);
    boolean existsByFeatureKey(String featureKey);
    boolean existsByName(String name);
}
