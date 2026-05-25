package com.zenelait.lms.repository;

import com.zenelait.lms.entity.ForumPost;
import com.zenelait.lms.entity.ForumReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForumReplyRepository extends JpaRepository<ForumReply, Long> {
    List<ForumReply> findByPostOrderByCreatedAtAsc(ForumPost post);
}
