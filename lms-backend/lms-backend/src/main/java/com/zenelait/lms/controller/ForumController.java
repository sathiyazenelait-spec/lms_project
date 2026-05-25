package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ForumController {

    private final ForumPostRepository  forumPostRepository;
    private final ForumReplyRepository forumReplyRepository;
    private final CourseRepository     courseRepository;
    private final BatchRepository      batchRepository;
    private final StudentRepository    studentRepository;

    // ══════════════════════════════════════════════════════════════════════════
    // STUDENT FORUM ENDPOINTS  — /api/student/forum/**
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/student/forum/courses
     * Returns all courses the student is enrolled in (via batches),
     * with member count and post count for each.
     */
    @Transactional
    @GetMapping("/api/student/forum/courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudentForumCourses(
            @AuthenticationPrincipal Student student) {

        Set<Long> seen = new HashSet<>();
        List<Course> courses = new ArrayList<>();

        // PATH 1: via batch (efficient — only fetch student's batches)
        batchRepository.findByStudentId(student.getId())
                .forEach(b -> {
                    // New many-to-many courses
                    if (b.getCourses() != null) {
                        b.getCourses().forEach(c -> {
                            if (seen.add(c.getId())) courses.add(c);
                        });
                    }
                    // Legacy single course FK
                    if (b.getCourse() != null) {
                        if (seen.add(b.getCourse().getId())) courses.add(b.getCourse());
                    }
                });

        // PATH 2: direct enrollment by admin
        Student full = studentRepository.findById(student.getId()).orElse(student);
        if (full.getEnrolledCourses() != null) {
            full.getEnrolledCourses().forEach(c -> {
                if (seen.add(c.getId())) courses.add(c);
            });
        }

        List<Map<String, Object>> result = courses.stream().map(c -> {
            // Forum members = all students in this course (via batch OR direct)
            Set<Long> memberIds = new HashSet<>();

            // via batches — checks both legacy and many-to-many
            batchRepository.findAll().stream()
                    .filter(b -> {
                        boolean inLegacy = b.getCourse() != null
                                && b.getCourse().getId().equals(c.getId());
                        boolean inManyToMany = b.getCourses() != null
                                && b.getCourses().stream()
                                   .anyMatch(bc -> bc.getId().equals(c.getId()));
                        return inLegacy || inManyToMany;
                    })
                    .flatMap(b -> b.getStudents().stream())
                    .forEach(s -> memberIds.add(s.getId()));

            // via direct enrollment
            if (c.getEnrolledStudents() != null) {
                c.getEnrolledStudents().forEach(s -> memberIds.add(s.getId()));
            }

            long memberCount = memberIds.size() + (c.getTeacher() != null ? 1 : 0);
            long postCount   = forumPostRepository.countByCourse(c);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("courseId",    c.getId());
            m.put("courseTitle", c.getTitle());
            m.put("department",  c.getDepartment());
            m.put("teacherName", c.getTeacher() != null ? c.getTeacher().getName() : "Unassigned");
            m.put("memberCount", memberCount);
            m.put("postCount",   postCount);
            m.put("status",      c.getStatus().name());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/student/forum/courses/{courseId}/posts
     * All posts in a course forum.
     */
    @Transactional
    @GetMapping("/api/student/forum/courses/{courseId}/posts")
    public ResponseEntity<ApiResponse<List<ForumPost>>> getPostsForCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Student student) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        List<ForumPost> posts = forumPostRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        return ResponseEntity.ok(ApiResponse.ok(posts));
    }

    /**
     * POST /api/student/forum/courses/{courseId}/posts
     * Student creates a new post.
     * Body: { "title": "...", "content": "...", "type": "QUESTION|DISCUSSION" }
     */
    @Transactional
    @PostMapping("/api/student/forum/courses/{courseId}/posts")
    public ResponseEntity<ApiResponse<ForumPost>> createStudentPost(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Student student,
            @RequestBody Map<String, String> body) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        ForumPost.PostType type = ForumPost.PostType.QUESTION;
        try { type = ForumPost.PostType.valueOf(body.getOrDefault("type", "QUESTION")); }
        catch (IllegalArgumentException ignored) {}

        ForumPost post = ForumPost.builder()
                .course(course)
                .postedByStudent(student)
                .title(body.get("title"))
                .content(body.get("content"))
                .type(type)
                .build();
        forumPostRepository.save(post);
        return ResponseEntity.ok(ApiResponse.ok("Post created", post));
    }

    /**
     * POST /api/student/forum/posts/{postId}/replies
     * Student replies to a post.
     * Body: { "content": "..." }
     */
    @Transactional
    @PostMapping("/api/student/forum/posts/{postId}/replies")
    public ResponseEntity<ApiResponse<ForumReply>> replyStudentPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Student student,
            @RequestBody Map<String, String> body) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        ForumReply reply = ForumReply.builder()
                .post(post)
                .repliedByStudent(student)
                .content(body.get("content"))
                .build();
        forumReplyRepository.save(reply);
        return ResponseEntity.ok(ApiResponse.ok("Reply added", reply));
    }

    /**
     * DELETE /api/student/forum/posts/{postId}
     * Student deletes their own post.
     */
    @Transactional
    @DeleteMapping("/api/student/forum/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deleteStudentPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Student student) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (post.getPostedByStudent() == null ||
            !post.getPostedByStudent().getId().equals(student.getId())) {
            throw new ResourceNotFoundException("You can only delete your own posts");
        }
        forumPostRepository.delete(post);
        return ResponseEntity.ok(ApiResponse.ok("Post deleted", null));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEACHER FORUM ENDPOINTS  — /api/teacher/forum/**
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/teacher/forum/courses
     * Teacher sees all their courses with member + post counts.
     */
    @Transactional
    @GetMapping("/api/teacher/forum/courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTeacherForumCourses(
            @AuthenticationPrincipal Teacher teacher) {

        List<Course> myCourses = courseRepository.findByTeacher(teacher);

        List<Map<String, Object>> result = myCourses.stream().map(c -> {
            long memberCount = batchRepository.findAll().stream()
                    .filter(b -> b.getCourse() != null && b.getCourse().getId().equals(c.getId()))
                    .flatMap(b -> b.getStudents().stream())
                    .map(Student::getId)
                    .distinct()
                    .count();

            long postCount = forumPostRepository.countByCourse(c);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("courseId",    c.getId());
            m.put("courseTitle", c.getTitle());
            m.put("department",  c.getDepartment());
            m.put("memberCount", memberCount);
            m.put("postCount",   postCount);
            m.put("status",      c.getStatus().name());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/teacher/forum/courses/{courseId}/posts
     */
    @Transactional
    @GetMapping("/api/teacher/forum/courses/{courseId}/posts")
    public ResponseEntity<ApiResponse<List<ForumPost>>> getTeacherCoursePosts(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Teacher teacher) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        return ResponseEntity.ok(ApiResponse.ok(
                forumPostRepository.findByCourseIdOrderByCreatedAtDesc(courseId)));
    }

    /**
     * GET /api/teacher/forum/courses/{courseId}/members
     * Lists all students enrolled in batches for this course.
     */
    @Transactional
    @GetMapping("/api/teacher/forum/courses/{courseId}/members")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCourseMembers(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Teacher teacher) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        // Collect unique students — via batch OR direct enrollment
        Set<Long> seen = new HashSet<>();
        List<Student> students = new ArrayList<>();

        // via batches
        batchRepository.findAll().stream()
                .filter(b -> b.getCourse() != null && b.getCourse().getId().equals(courseId))
                .flatMap(b -> b.getStudents().stream())
                .filter(s -> seen.add(s.getId()))
                .forEach(students::add);

        // via direct enrollment
        if (course.getEnrolledStudents() != null) {
            course.getEnrolledStudents().stream()
                    .filter(s -> seen.add(s.getId()))
                    .forEach(students::add);
        }

        students.sort(Comparator.comparing(Student::getName));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("course",   course);
        result.put("teacher",  teacher);
        result.put("students", students);
        result.put("total",    students.size() + 1);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * POST /api/teacher/forum/courses/{courseId}/posts
     * Teacher posts an announcement or discussion.
     */
    @Transactional
    @PostMapping("/api/teacher/forum/courses/{courseId}/posts")
    public ResponseEntity<ApiResponse<ForumPost>> createTeacherPost(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, String> body) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        ForumPost.PostType type = ForumPost.PostType.DISCUSSION;
        try { type = ForumPost.PostType.valueOf(body.getOrDefault("type", "DISCUSSION")); }
        catch (IllegalArgumentException ignored) {}

        ForumPost post = ForumPost.builder()
                .course(course)
                .postedByTeacher(teacher)
                .title(body.get("title"))
                .content(body.get("content"))
                .type(type)
                .build();
        forumPostRepository.save(post);
        return ResponseEntity.ok(ApiResponse.ok("Post created", post));
    }

    /**
     * POST /api/teacher/forum/posts/{postId}/replies
     * Teacher replies to a post.
     */
    @Transactional
    @PostMapping("/api/teacher/forum/posts/{postId}/replies")
    public ResponseEntity<ApiResponse<ForumReply>> replyTeacherPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, String> body) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        ForumReply reply = ForumReply.builder()
                .post(post)
                .repliedByTeacher(teacher)
                .content(body.get("content"))
                .build();
        forumReplyRepository.save(reply);
        return ResponseEntity.ok(ApiResponse.ok("Reply added", reply));
    }

    /**
     * DELETE /api/teacher/forum/posts/{postId}
     * Teacher can delete any post in their course.
     */
    @Transactional
    @DeleteMapping("/api/teacher/forum/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacherPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Teacher teacher) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        forumPostRepository.delete(post);
        return ResponseEntity.ok(ApiResponse.ok("Post deleted", null));
    }

    /**
     * DELETE /api/teacher/forum/replies/{replyId}
     * Teacher can delete any reply.
     */
    @Transactional
    @DeleteMapping("/api/teacher/forum/replies/{replyId}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacherReply(
            @PathVariable Long replyId,
            @AuthenticationPrincipal Teacher teacher) {
        forumReplyRepository.deleteById(replyId);
        return ResponseEntity.ok(ApiResponse.ok("Reply deleted", null));
    }
}
