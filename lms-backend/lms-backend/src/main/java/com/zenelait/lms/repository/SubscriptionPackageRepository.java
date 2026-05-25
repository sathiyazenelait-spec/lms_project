package com.zenelait.lms.repository;

import com.zenelait.lms.entity.SubscriptionPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubscriptionPackageRepository extends JpaRepository<SubscriptionPackage, Long> {
    List<SubscriptionPackage> findByActiveTrue();
}
