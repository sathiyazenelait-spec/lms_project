package com.zenelait.lms.repository;

import com.zenelait.lms.entity.ParentWallet;
import com.zenelait.lms.entity.Parent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ParentWalletRepository extends JpaRepository<ParentWallet, Long> {
    Optional<ParentWallet> findByParent(Parent parent);
    Optional<ParentWallet> findByParentId(Long parentId);
}
