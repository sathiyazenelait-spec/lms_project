package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatRepo;
    private final TeacherRepository     teacherRepo;
    private final ParentRepository      parentRepo;

    // ════════════════════════════════════════════════
    // TEACHER ENDPOINTS  →  /api/teacher/chat/**
    // ════════════════════════════════════════════════

    /** All parents the teacher has a conversation with */
    @GetMapping("/api/teacher/chat/conversations")
    @PreAuthorize("hasRole('TEACHER')")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> teacherConversations(
            @AuthenticationPrincipal Teacher teacher) {

        Teacher fresh = teacherRepo.findById(teacher.getId()).orElseThrow();
        List<Parent> parents = chatRepo.findParentsByTeacher(fresh);

        List<Map<String, Object>> result = parents.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("parentId",   p.getId());
            m.put("parentName", p.getName());
            m.put("parentEmail",p.getEmail());
            // unread = messages sent by PARENT that teacher hasn't read
            long unread = chatRepo.countByTeacherAndSenderRoleAndReadByTeacher(fresh, "PARENT", false);
            m.put("unread", unread);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Messages in a specific teacher<->parent thread */
    @GetMapping("/api/teacher/chat/messages/{parentId}")
    @PreAuthorize("hasRole('TEACHER')")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> teacherGetMessages(
            @AuthenticationPrincipal Teacher teacher,
            @PathVariable Long parentId) {

        Teacher fresh = teacherRepo.findById(teacher.getId()).orElseThrow();
        Parent  parent = parentRepo.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent not found"));

        List<ChatMessage> msgs = chatRepo.findByTeacherAndParentOrderBySentAtAsc(fresh, parent);

        // Mark teacher-unread messages as read
        msgs.stream()
            .filter(x -> "PARENT".equals(x.getSenderRole()) && !x.isReadByTeacher())
            .forEach(x -> { x.setReadByTeacher(true); chatRepo.save(x); });

        return ResponseEntity.ok(ApiResponse.ok(toMaps(msgs)));
    }

    /** Teacher sends a message to a parent */
    @PostMapping("/api/teacher/chat/send/{parentId}")
    @PreAuthorize("hasRole('TEACHER')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> teacherSend(
            @AuthenticationPrincipal Teacher teacher,
            @PathVariable Long parentId,
            @RequestBody Map<String, String> body) {

        Teacher fresh = teacherRepo.findById(teacher.getId()).orElseThrow();
        Parent  parent = parentRepo.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent not found"));

        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) return ResponseEntity.badRequest()
                .body(ApiResponse.error("Message content is required"));

        ChatMessage msg = ChatMessage.builder()
                .teacher(fresh)
                .parent(parent)
                .senderRole("TEACHER")
                .content(content)
                .readByTeacher(true)
                .readByParent(false)
                .build();
        chatRepo.save(msg);

        return ResponseEntity.ok(ApiResponse.ok("Message sent", toMap(msg)));
    }

    /** Search all parents (for teacher to start a new conversation) */
    @GetMapping("/api/teacher/chat/search-parents")
    @PreAuthorize("hasRole('TEACHER')")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> teacherSearchParents(
            @RequestParam(defaultValue = "") String q) {

        List<Parent> all = parentRepo.findAll();
        String query = q.toLowerCase();

        List<Map<String, Object>> result = all.stream()
            .filter(p -> q.isEmpty()
                    || p.getName().toLowerCase().contains(query)
                    || p.getEmail().toLowerCase().contains(query))
            .map(p -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",    p.getId());
                m.put("name",  p.getName());
                m.put("email", p.getEmail());
                return m;
            })
            .limit(10)
            .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ════════════════════════════════════════════════
    // PARENT ENDPOINTS  →  /api/parent/chat/**
    // ════════════════════════════════════════════════

    /** All teachers the parent has a conversation with */
    @GetMapping("/api/parent/chat/conversations")
    @PreAuthorize("hasRole('PARENT')")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> parentConversations(
            @AuthenticationPrincipal Parent parent) {

        Parent fresh = parentRepo.findById(parent.getId()).orElseThrow();
        List<Teacher> teachers = chatRepo.findTeachersByParent(fresh);

        List<Map<String, Object>> result = teachers.stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("teacherId",   t.getId());
            m.put("teacherName", t.getName());
            m.put("department",  t.getDepartment());
            long unread = chatRepo.countByParentAndSenderRoleAndReadByParent(fresh, "TEACHER", false);
            m.put("unread", unread);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Messages in a specific teacher<->parent thread */
    @GetMapping("/api/parent/chat/messages/{teacherId}")
    @PreAuthorize("hasRole('PARENT')")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> parentGetMessages(
            @AuthenticationPrincipal Parent parent,
            @PathVariable Long teacherId) {

        Parent  fresh   = parentRepo.findById(parent.getId()).orElseThrow();
        Teacher teacher = teacherRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        List<ChatMessage> msgs = chatRepo.findByTeacherAndParentOrderBySentAtAsc(teacher, fresh);

        // Mark parent-unread messages as read
        msgs.stream()
            .filter(x -> "TEACHER".equals(x.getSenderRole()) && !x.isReadByParent())
            .forEach(x -> { x.setReadByParent(true); chatRepo.save(x); });

        return ResponseEntity.ok(ApiResponse.ok(toMaps(msgs)));
    }

    /** Parent sends a message to a teacher */
    @PostMapping("/api/parent/chat/send/{teacherId}")
    @PreAuthorize("hasRole('PARENT')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> parentSend(
            @AuthenticationPrincipal Parent parent,
            @PathVariable Long teacherId,
            @RequestBody Map<String, String> body) {

        Parent  fresh   = parentRepo.findById(parent.getId()).orElseThrow();
        Teacher teacher = teacherRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) return ResponseEntity.badRequest()
                .body(ApiResponse.error("Message content is required"));

        ChatMessage msg = ChatMessage.builder()
                .teacher(teacher)
                .parent(fresh)
                .senderRole("PARENT")
                .content(content)
                .readByTeacher(false)
                .readByParent(true)
                .build();
        chatRepo.save(msg);

        return ResponseEntity.ok(ApiResponse.ok("Message sent", toMap(msg)));
    }

    /** Search all teachers (for parent to start a new conversation) */
    @GetMapping("/api/parent/chat/search-teachers")
    @PreAuthorize("hasRole('PARENT')")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> parentSearchTeachers(
            @RequestParam(defaultValue = "") String q) {

        List<Teacher> all = teacherRepo.findAll();
        String query = q.toLowerCase();

        List<Map<String, Object>> result = all.stream()
            .filter(t -> q.isEmpty()
                    || t.getName().toLowerCase().contains(query)
                    || (t.getDepartment() != null && t.getDepartment().toLowerCase().contains(query)))
            .map(t -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",         t.getId());
                m.put("name",       t.getName());
                m.put("department", t.getDepartment());
                m.put("email",      t.getEmail());
                return m;
            })
            .limit(10)
            .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(ChatMessage m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",         m.getId());
        map.put("senderRole", m.getSenderRole());
        map.put("content",    m.getContent());
        map.put("sentAt",     m.getSentAt());
        map.put("teacherId",  m.getTeacher().getId());
        map.put("parentId",   m.getParent().getId());
        return map;
    }

    private List<Map<String, Object>> toMaps(List<ChatMessage> msgs) {
        return msgs.stream().map(this::toMap).collect(Collectors.toList());
    }
}
