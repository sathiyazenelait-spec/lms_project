package com.zenelait.lms.repository;

import com.zenelait.lms.entity.Parent;
import com.zenelait.lms.entity.ParentChild;
import com.zenelait.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParentChildRepository extends JpaRepository<ParentChild, Long> {
    List<ParentChild> findByParent(Parent parent);
    List<ParentChild> findByChild(Student child);
}
