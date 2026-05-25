package com.zenelait.lms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.zenelait.lms.entity.ChatMessage;
import com.zenelait.lms.entity.Parent;
import com.zenelait.lms.entity.Teacher;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
	List<ChatMessage> findByTeacherAndParentOrderBySentAtAsc(Teacher teacher, Parent parent);

    /** All distinct parents who have a thread with this teacher */
    @Query("SELECT DISTINCT m.parent FROM ChatMessage m WHERE m.teacher = :teacher")
    List<Parent> findParentsByTeacher(@Param("teacher") Teacher teacher);

    /** All distinct teachers who have a thread with this parent */
    @Query("SELECT DISTINCT m.teacher FROM ChatMessage m WHERE m.parent = :parent")
    List<Teacher> findTeachersByParent(@Param("parent") Parent parent);

    /** Unread count for teacher */
    long countByTeacherAndSenderRoleAndReadByTeacher(Teacher teacher, String senderRole, boolean read);

    /** Unread count for parent */
    long countByParentAndSenderRoleAndReadByParent(Parent parent, String senderRole, boolean read);
}
