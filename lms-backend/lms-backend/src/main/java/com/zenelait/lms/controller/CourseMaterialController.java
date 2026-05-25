package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.*;
import com.zenelait.lms.service.notification.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class CourseMaterialController {

    private final CourseMaterialRepository materialRepository;
    private final CourseRepository         courseRepository;
    private final TeacherRepository        teacherRepository;
    private final BatchRepository          batchRepository;
    private final StudentRepository        studentRepository;
    private final NotificationService      notificationService;

    // ═══════════════════════════════════════════════════════════════════════
    // TEACHER ENDPOINTS  —  /api/teacher/materials
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /api/teacher/materials?courseId=X  — all materials for teacher's course */
    @Transactional
    @GetMapping("/api/teacher/materials")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTeacherMaterials(
            @AuthenticationPrincipal Teacher teacher,
            @RequestParam(required = false) Long courseId) {

        List<CourseMaterial> materials;
        if (courseId != null) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            materials = materialRepository.findByCourseOrderByCreatedAtDesc(course);
        } else {
            materials = materialRepository.findByUploadedByOrderByCreatedAtDesc(teacher);
        }
        return ResponseEntity.ok(ApiResponse.ok(materials.stream()
                .map(this::toMap).collect(Collectors.toList())));
    }

    /** POST /api/teacher/materials — upload a note / video / meet link */
    @Transactional
    @PostMapping("/api/teacher/materials")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMaterial(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {

        Long courseId = Long.valueOf(body.get("courseId").toString());
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        CourseMaterial.MaterialType type =
                CourseMaterial.MaterialType.valueOf(body.get("type").toString());

        LocalDateTime scheduledAt = null;
        if (body.get("scheduledAt") != null && !body.get("scheduledAt").toString().isBlank()) {
            scheduledAt = LocalDateTime.parse(body.get("scheduledAt").toString());
        }

        CourseMaterial mat = CourseMaterial.builder()
                .course(course)
                .uploadedBy(teacher)
                .type(type)
                .title((String) body.get("title"))
                .description(body.containsKey("description") ? (String) body.get("description") : null)
                .content((String) body.get("content"))
                .thumbnailUrl(body.containsKey("thumbnailUrl") ? (String) body.get("thumbnailUrl") : null)
                .scheduledAt(scheduledAt)
                .visible(true)
                .build();

        materialRepository.save(mat);

        // Use NotificationService — sends in-app + email to students, parents, admins
        List<Student> students = getStudentsForCourse(course);
        List<String> emailWarnings = notificationService.onMaterialUploaded(mat, students);
        Map<String, Object> resp = new java.util.LinkedHashMap<>(toMap(mat));
        if (!emailWarnings.isEmpty()) resp.put("emailWarnings", emailWarnings);
        return ResponseEntity.ok(ApiResponse.ok("Material uploaded", resp));
    }

    /** PATCH /api/teacher/materials/{id}/visibility — show/hide */
    @Transactional
    @PatchMapping("/api/teacher/materials/{id}/visibility")
    public ResponseEntity<ApiResponse<String>> toggleVisibility(
            @AuthenticationPrincipal Teacher teacher,
            @PathVariable Long id) {
        CourseMaterial mat = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found"));
        mat.setVisible(!mat.isVisible());
        materialRepository.save(mat);
        return ResponseEntity.ok(ApiResponse.ok(
                mat.isVisible() ? "Material is now visible to students" : "Material is now hidden", null));
    }

    /** DELETE /api/teacher/materials/{id} */
    @Transactional
    @DeleteMapping("/api/teacher/materials/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @AuthenticationPrincipal Teacher teacher,
            @PathVariable Long id) {
        materialRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Material deleted", null));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STUDENT ENDPOINTS  —  /api/student/materials
    // ═══════════════════════════════════════════════════════════════════════

    /** GET /api/student/materials?courseId=X — visible materials for a course */
    @Transactional
    @GetMapping("/api/student/materials")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudentMaterials(
            @AuthenticationPrincipal Student student,
            @RequestParam(required = false) Long courseId) {

        List<CourseMaterial> materials;

        if (courseId != null) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            materials = materialRepository.findByCourseAndVisibleTrueOrderByCreatedAtDesc(course);
        } else {
            // Return all visible materials from ALL courses the student is enrolled in
            Set<Long> seen = new HashSet<>();
            materials = new ArrayList<>();
            batchRepository.findAll().stream()
                    .filter(b -> b.getStudents().stream().anyMatch(s -> s.getId().equals(student.getId())))
                    .filter(b -> b.getCourse() != null)
                    .forEach(b -> {
                        if (seen.add(b.getCourse().getId())) {
                            materials.addAll(
                                materialRepository.findByCourseAndVisibleTrueOrderByCreatedAtDesc(b.getCourse())
                            );
                        }
                    });
            // Also direct enrollments
            Student fresh = studentRepository.findById(student.getId()).orElse(student);
            // Direct enrollments — use native query, not the unreliable JPA collection
            courseRepository.findDirectlyEnrolledByStudentId(student.getId()).forEach(c -> {
                    if (seen.add(c.getId())) {
                        materials.addAll(
                            materialRepository.findByCourseAndVisibleTrueOrderByCreatedAtDesc(c)
                        );
                    }
                });
            // Sort newest first
            materials.sort(Comparator.comparing(CourseMaterial::getCreatedAt).reversed());
        }

        return ResponseEntity.ok(ApiResponse.ok(
                materials.stream().map(this::toMap).collect(Collectors.toList())));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private Map<String, Object> toMap(CourseMaterial m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",          m.getId());
        map.put("type",        m.getType().name());
        map.put("title",       m.getTitle());
        map.put("description", m.getDescription());
        map.put("content",     m.getContent());
        map.put("thumbnailUrl",m.getThumbnailUrl());
        map.put("scheduledAt", m.getScheduledAt() != null ? m.getScheduledAt().toString() : null);
        map.put("visible",     m.isVisible());
        map.put("createdAt",   m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
        // Course info
        if (m.getCourse() != null) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("id",    m.getCourse().getId());
            c.put("title", m.getCourse().getTitle());
            map.put("course", c);
        }
        // Teacher info
        if (m.getUploadedBy() != null) {
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("id",   m.getUploadedBy().getId());
            t.put("name", m.getUploadedBy().getName());
            map.put("uploadedBy", t);
        }
        return map;
    }

    private List<Student> getStudentsForCourse(Course course) {
        Set<Long> seen = new HashSet<>();
        List<Student> students = new ArrayList<>();
        batchRepository.findAll().stream()
                .filter(b -> b.getCourse() != null && b.getCourse().getId().equals(course.getId()))
                .flatMap(b -> b.getStudents().stream())
                .forEach(s -> { if (seen.add(s.getId())) students.add(s); });
        return students;
    }
}