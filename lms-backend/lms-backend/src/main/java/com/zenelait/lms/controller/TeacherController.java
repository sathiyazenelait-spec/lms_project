package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.*;
import com.zenelait.lms.service.notification.NotificationService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {

    private final TeacherRepository              teacherRepository;
    private final CourseRepository               courseRepository;
    private final AssignmentRepository           assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final AttendanceRepository           attendanceRepository;
    private final AnnouncementRepository         announcementRepository;
    private final NotificationRepository         notificationRepository;
    private final StudentRepository              studentRepository;
    private final BatchRepository                batchRepository;
    private final NotificationService notificationService;
    private final ExamRepository                 examRepository;
    private final ExamStudentRepository          examStudentRepository;
    private final ExamResultRepository           examResultRepository;
    private final ParentChildRepository          parentChildRepository;
    private final TeacherReviewRepository        teacherReviewRepository;
    private final CertificateRepository          certificateRepository;

    private final AssessmentRepository           assessmentRepository;
    private final AssessmentQuestionRepository   assessmentQuestionRepository;
    private final QuestionBankRepository         questionBankRepository;
    private final AssessmentAttemptRepository    assessmentAttemptRepository;
    private final AssessmentAnswerRepository     assessmentAnswerRepository;
    private final AssignmentTemplateRepository   assignmentTemplateRepository;

    // ── Profile ───────────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Teacher>> getProfile(@AuthenticationPrincipal Teacher teacher) {
        // Always fetch fresh from DB
        Teacher fresh = teacherRepository.findById(teacher.getId()).orElse(teacher);
        return ResponseEntity.ok(ApiResponse.ok(fresh));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Teacher>> updateProfile(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, String> body) {
        // Fetch fresh from DB — never mutate the stale principal
        Teacher fresh = teacherRepository.findById(teacher.getId()).orElse(teacher);
        if (body.containsKey("name"))          fresh.setName(body.get("name"));
        if (body.containsKey("phone"))         fresh.setPhone(body.get("phone"));
        if (body.containsKey("address"))       fresh.setAddress(body.get("address"));
        if (body.containsKey("department"))    fresh.setDepartment(body.get("department"));
        if (body.containsKey("qualification")) fresh.setQualification(body.get("qualification"));
        if (body.containsKey("gender"))        fresh.setGender(body.get("gender"));
        if (body.containsKey("profilePicUrl")) fresh.setProfilePicUrl(body.get("profilePicUrl"));
        teacherRepository.save(fresh);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", fresh));
    }

 // ── Courses ───────────────────────────────────────────────────────
    @Transactional
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyCourses(
            @AuthenticationPrincipal Teacher teacher) {
        Long orgId = teacher.getOrganizationId();
        List<Course> courses = courseRepository.findByTeacherAndOrganizationId(teacher, orgId);
        List<com.zenelait.lms.entity.Batch> allBatches = batchRepository.findByOrganizationId(orgId);
        List<Map<String, Object>> result = courses.stream().map(c -> {
            // Find any batch that contains this course (via many-to-many or legacy single-course link)
            com.zenelait.lms.entity.Batch linkedBatch = allBatches.stream()
                .filter(b -> (b.getCourses() != null && b.getCourses().stream().anyMatch(bc -> bc.getId().equals(c.getId())))
                          || (b.getCourse() != null && b.getCourse().getId().equals(c.getId())))
                .findFirst().orElse(null);

            // 1. Calculate unique students enrolled directly or via batches
            Set<Student> students = new HashSet<>();
            if (c.getEnrolledStudents() != null) {
                students.addAll(c.getEnrolledStudents());
            }
            allBatches.stream()
                .filter(b -> (b.getCourse() != null && b.getCourse().getId().equals(c.getId()))
                        || (b.getCourses() != null && b.getCourses().stream().anyMatch(bc -> bc.getId().equals(c.getId()))))
                .forEach(b -> {
                    if (b.getStudents() != null) {
                        students.addAll(b.getStudents());
                    }
                });
            int studentCount = students.size();

            // 2. Average progress of all students based on assignment completions
            List<Assignment> assignments = assignmentRepository.findByCourse(c);
            int avgProgress = 0;
            if (!assignments.isEmpty() && !students.isEmpty()) {
                int totalProgressSum = 0;
                for (Student s : students) {
                    long submittedCount = assignments.stream()
                        .filter(a -> submissionRepository.existsByAssignmentAndStudent(a, s))
                        .count();
                    totalProgressSum += (int) ((submittedCount * 100) / assignments.size());
                }
                avgProgress = totalProgressSum / students.size();
            }

            // 3. Count of pending assignment submissions (ungraded)
            long pendingCount = 0;
            if (!assignments.isEmpty()) {
                for (Assignment a : assignments) {
                    pendingCount += submissionRepository.findByAssignment(a).stream()
                        .filter(sub -> sub.getStatus() == AssignmentSubmission.SubmissionStatus.SUBMITTED 
                                    || sub.getStatus() == AssignmentSubmission.SubmissionStatus.LATE)
                        .count();
                }
            }

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          c.getId());
            m.put("title",       c.getTitle());
            m.put("description", c.getDescription());
            m.put("department",  c.getDepartment());
            m.put("status",      c.getStatus() != null ? c.getStatus().name() : "ACTIVE");
            m.put("batchId",     linkedBatch != null ? linkedBatch.getId()   : null);
            m.put("batchName",   linkedBatch != null ? linkedBatch.getName() : null);
            m.put("students",    studentCount);
            m.put("progress",    avgProgress);
            m.put("pending",     pendingCount);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Assignments ───────────────────────────────────────────────────
    @Transactional
    @GetMapping("/assignments")
    public ResponseEntity<ApiResponse<List<Assignment>>> getMyAssignments(
            @AuthenticationPrincipal Teacher teacher) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentRepository.findByTeacher(teacher)));
    }
    
    // ── Get all students for a course with all attendance records ──
    @GetMapping("/courses/{courseId}/attendance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCourseAttendance(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Teacher teacher
    ) {
        // Ensure course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Security: check teacher owns the course
        if (!course.getTeacher().getId().equals(teacher.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.ok("Not allowed", null));
        }

        List<Attendance> records = attendanceRepository.findByCourseId(courseId);

        // Convert to JSON-friendly format
        List<Map<String, Object>> result = records.stream()
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("studentId", a.getStudent().getId());
                    m.put("studentName", a.getStudent().getName());
                    m.put("date", a.getDate());
                    m.put("status", a.getStatus().name());
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    
    @Transactional
    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudentsByCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Teacher teacher) {
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        // Security: ensure teacher owns this course
        if (!course.getTeacher().getId().equals(teacher.getId())) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.ok("Not allowed", null));
        }

        Set<Long> seen = new HashSet<>();
        List<Map<String, Object>> students = new ArrayList<>();

        // 1. Direct enrollments
        if (course.getEnrolledStudents() != null) {
            course.getEnrolledStudents().forEach(s -> {
                if (seen.add(s.getId())) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("name", s.getName());
                    m.put("userId", s.getUserId());
                    m.put("email", s.getEmail());
                    m.put("department", s.getDepartment());
                    students.add(m);
                }
            });
        }

        // 2. Batch enrollments (both legacy course field and list of courses)
        batchRepository.findAll().stream()
                .filter(b -> (b.getCourse() != null && b.getCourse().getId().equals(courseId))
                        || (b.getCourses() != null && b.getCourses().stream().anyMatch(c -> c.getId().equals(courseId))))
                .flatMap(b -> b.getStudents().stream())
                .forEach(s -> {
                    if (seen.add(s.getId())) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", s.getId());
                        m.put("name", s.getName());
                        m.put("userId", s.getUserId());
                        m.put("email", s.getEmail());
                        m.put("department", s.getDepartment());
                        students.add(m);
                    }
                });

        return ResponseEntity.ok(ApiResponse.ok(students));
    }
    

    @PostMapping("/assignments")
    public ResponseEntity<ApiResponse<Assignment>> createAssignment(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {
        Long courseId = Long.valueOf(body.get("courseId").toString());
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        Assignment assignment = Assignment.builder()
                .title((String) body.get("title"))
                .description((String) body.get("description"))
                .course(course)
                .teacher(teacher)
                .dueDate(body.get("dueDate") != null && !body.get("dueDate").toString().isEmpty()
                        ? LocalDateTime.parse((String) body.get("dueDate")) : null)
                .maxMarks(body.containsKey("maxMarks") && body.get("maxMarks") != null
                        ? Integer.parseInt(body.get("maxMarks").toString()) : 100)
                .taskType((String) body.get("taskType"))
                .attachments((String) body.get("attachments"))
                .submissionType((String) body.getOrDefault("submissionType", "ANY"))
                .allowedFileTypes((String) body.get("allowedFileTypes"))
                .maxFileSize(body.get("maxFileSize") != null && !body.get("maxFileSize").toString().isEmpty()
                        ? Integer.parseInt(body.get("maxFileSize").toString()) : null)
                .allowLate(body.get("allowLate") != null ? Boolean.parseBoolean(body.get("allowLate").toString()) : true)
                .lateDeadline(body.get("lateDeadline") != null && !body.get("lateDeadline").toString().isEmpty()
                        ? LocalDateTime.parse((String) body.get("lateDeadline")) : null)
                .latePenalty(body.get("latePenalty") != null && !body.get("latePenalty").toString().isEmpty()
                        ? Integer.parseInt(body.get("latePenalty").toString()) : 0)
                .status(body.get("status") != null ? (String) body.get("status") : "PUBLISHED")
                .organizationId(teacher.getOrganizationId())
                .build();
        assignmentRepository.save(assignment);
        return ResponseEntity.ok(ApiResponse.ok("Assignment created", assignment));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(@PathVariable Long id) {
        assignmentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Assignment deleted", null));
    }

    // ── Submissions / Grading ─────────────────────────────────────────
    @Transactional
    @GetMapping("/assignments/{id}/submissions")
    public ResponseEntity<ApiResponse<List<AssignmentSubmission>>> getSubmissions(
            @PathVariable Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + id));
        return ResponseEntity.ok(ApiResponse.ok(submissionRepository.findByAssignment(assignment)));
    }

    @PatchMapping("/submissions/{id}/grade")
    public ResponseEntity<ApiResponse<AssignmentSubmission>> gradeSubmission(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        AssignmentSubmission sub = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found: " + id));
        sub.setMarksObtained((Integer) body.get("marks"));
        sub.setTeacherFeedback((String) body.getOrDefault("feedback", ""));
        sub.setStatus(AssignmentSubmission.SubmissionStatus.GRADED);
        sub.setGradedAt(LocalDateTime.now());
        submissionRepository.save(sub);
        return ResponseEntity.ok(ApiResponse.ok("Submission graded", sub));
    }

    // ── Attendance ────────────────────────────────────────────────────
    @PostMapping("/attendance")
    public ResponseEntity<ApiResponse<Void>> markAttendance(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {
        Long courseId = Long.valueOf(body.get("courseId").toString());
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        LocalDate date = LocalDate.parse((String) body.get("date"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = (List<Map<String, Object>>) body.get("entries");
        for (Map<String, Object> entry : entries) {
            Long studentId = Long.valueOf(entry.get("studentId").toString());
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
            Attendance.AttendanceStatus status =
                    Attendance.AttendanceStatus.valueOf((String) entry.get("status"));

            Attendance record = Attendance.builder()
                    .student(student)
                    .course(course)
                    .date(date)
                    .status(status)
                    .build();
            attendanceRepository.save(record);
            // Pass teacher name+email so attendance email From shows the teacher
            notificationService.sendAttendanceNotification(student, record,
                    teacher != null ? teacher.getName() : null,
                    teacher != null ? teacher.getEmail() : null);
        }
        return ResponseEntity.ok(ApiResponse.ok("Attendance marked", null));
    }


    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAttendance(
            @RequestParam Long courseId,
            @RequestParam String date) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        return ResponseEntity.ok(ApiResponse.ok(
                attendanceRepository.findByCourseAndDate(course, LocalDate.parse(date))));
    }

    // ── Announcements ─────────────────────────────────────────────────
    @PostMapping("/announcements")
    @Transactional
    public ResponseEntity<ApiResponse<Announcement>> createAnnouncement(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {
        
        Long courseId = body.containsKey("courseId") && body.get("courseId") != null
                ? Long.valueOf(body.get("courseId").toString()) : null;

        Announcement ann = Announcement.builder()
                .title((String) body.get("title"))
                .content((String) body.get("content"))
                .authorName(teacher.getName())
                .targetRole(Role.STUDENT)
                .organizationId(teacher.getOrganizationId())
                .courseId(courseId)
                .build();
        announcementRepository.save(ann);

        // Collect recipient student emails
        List<String> studentEmails = new java.util.ArrayList<>();
        if (courseId != null) {
            List<Object[]> rows = studentRepository.findAllStudentsInCourse(courseId);
            for (Object[] r : rows) {
                if (r.length > 2 && r[2] != null) {
                    studentEmails.add(r[2].toString());
                }
            }
        } else {
            List<Student> students = teacher.getOrganizationId() != null
                    ? studentRepository.findByOrganizationId(teacher.getOrganizationId())
                    : studentRepository.findAll();
            for (Student s : students) {
                if (s.getEmail() != null) {
                    studentEmails.add(s.getEmail());
                }
            }
        }

        // Send notifications
        notificationService.sendAnnouncementNotification(ann, studentEmails, teacher.getName(), teacher.getEmail());

        return ResponseEntity.ok(ApiResponse.ok("Announcement created and sent", ann));
    }

    /**
     * POST /api/teacher/courses
     * Teacher creates a course in their own department and assigns it to a batch.
     */
    @Transactional
    @PostMapping("/courses/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCourse(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {

        // Always use teacher's own department
        String dept = teacher.getDepartment();

        // Validate batch belongs to teacher's department
        Long batchId = body.containsKey("batchId") && body.get("batchId") != null
                ? Long.valueOf(body.get("batchId").toString()) : null;
        if (batchId == null) {
            throw new ResourceNotFoundException("batchId is required");
        }
        com.zenelait.lms.entity.Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + batchId));

        if (!dept.equalsIgnoreCase(batch.getDepartment())) {
            return ResponseEntity.badRequest().body(
                ApiResponse.ok("Batch department (" + batch.getDepartment() +
                    ") does not match your department (" + dept + ")", null));
        }

        // Determine status from batch dates
        java.time.LocalDate today = java.time.LocalDate.now();
        com.zenelait.lms.entity.Course.CourseStatus status;
        if (batch.getStartDate() != null && today.isBefore(batch.getStartDate())) {
            status = com.zenelait.lms.entity.Course.CourseStatus.DRAFT;
        } else if (batch.getEndDate() != null && today.isAfter(batch.getEndDate())) {
            status = com.zenelait.lms.entity.Course.CourseStatus.INACTIVE;
        } else {
            status = com.zenelait.lms.entity.Course.CourseStatus.ACTIVE;
        }

        com.zenelait.lms.entity.Course course = com.zenelait.lms.entity.Course.builder()
                .title((String) body.get("title"))
                .description(body.containsKey("description") ? (String) body.get("description") : null)
                .department(dept)
                .durationHours(body.containsKey("durationHours") && body.get("durationHours") != null
                        ? Integer.valueOf(body.get("durationHours").toString()) : 0)
                .teacher(teacher)
                .status(status)
                .build();

        courseRepository.save(course);

        // Auto-assign course to the selected batch
        batch.setCourse(course);
        batchRepository.save(batch);

        // Notify: admins + batch students + linked parents
        List<String> tcWarn = notificationService.onCourseCreated(course, batch, "TEACHER",
                teacher.getName(), teacher.getEmail());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        if (!tcWarn.isEmpty()) result.put("emailWarnings", tcWarn);
        result.put("id",         course.getId());
        result.put("title",      course.getTitle());
        result.put("department", course.getDepartment());
        result.put("status",     course.getStatus().name());
        result.put("batchId",    batch.getId());
        result.put("batchName",  batch.getName());

        return ResponseEntity.ok(ApiResponse.ok("Course created and assigned to batch", result));
    }

    /**
     * GET /api/teacher/batches
     * Returns ONLY batches in the teacher's OWN department.
     * Department is taken from the teacher's profile — cannot be overridden by caller.
     */
    @Transactional
    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDeptBatches(
            @AuthenticationPrincipal Teacher teacher) {

        // ALWAYS use teacher's own department — never accept it from the request
        String dept = teacher.getDepartment();
        if (dept == null || dept.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }

        List<Map<String, Object>> result = batchRepository.findByDepartment(dept).stream()
                .map(b -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id",           b.getId());
                    m.put("name",         b.getName());
                    m.put("department",   b.getDepartment());
                    m.put("status",       b.getStatus() != null ? b.getStatus().name() : "UPCOMING");
                    m.put("startDate",    b.getStartDate() != null ? b.getStartDate().toString() : null);
                    m.put("endDate",      b.getEndDate()   != null ? b.getEndDate().toString()   : null);
                    m.put("studentCount", b.getStudents() != null ? b.getStudents().size() : 0);
                    if (b.getCourse() != null) {
                        Map<String, Object> cm = new java.util.LinkedHashMap<>();
                        cm.put("id",    b.getCourse().getId());
                        cm.put("title", b.getCourse().getTitle());
                        m.put("course", cm);
                    } else {
                        m.put("course", null);
                    }
                    return m;
                })
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/teacher/colleagues?department=X
     * Returns other teachers in the same department (excludes self).
     */
    @Transactional
    @GetMapping("/colleagues")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getColleagues(
            @AuthenticationPrincipal Teacher teacher,
            @RequestParam(required = false) String department) {

        String dept = (department != null && !department.isBlank())
                ? department : teacher.getDepartment();

        List<Map<String, Object>> result = teacherRepository.findByDepartment(dept).stream()
                .filter(t -> !t.getId().equals(teacher.getId())) // exclude self
                .map(t -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id",         t.getId());
                    m.put("name",       t.getName());
                    m.put("userId",     t.getUserId());
                    m.put("email",      t.getEmail());
                    m.put("department", t.getDepartment());
                    m.put("active",     t.isEnabled());
                    return m;
                })
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/teacher/dept-students?department=X
     * Returns all students in a given department (via batch enrollment).
     */
    @Transactional
    @GetMapping("/dept-students")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDeptStudents(
            @AuthenticationPrincipal Teacher teacher,
            @RequestParam String department) {

        Set<Long> seen = new java.util.HashSet<>();
        List<Map<String, Object>> students = new java.util.ArrayList<>();

        batchRepository.findByDepartment(department).stream()
                .flatMap(b -> b.getStudents().stream())
                .filter(s -> department.equalsIgnoreCase(s.getDepartment()))
                .forEach(s -> {
                    if (seen.add(s.getId())) {
                        Map<String, Object> m = new java.util.LinkedHashMap<>();
                        m.put("id",         s.getId());
                        m.put("name",       s.getName());
                        m.put("userId",     s.getUserId());
                        m.put("email",      s.getEmail());
                        m.put("department", s.getDepartment());
                        students.add(m);
                    }
                });

        return ResponseEntity.ok(ApiResponse.ok(students));
    }

    // ── Notifications ─────────────────────────────────────────────────
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(
            @AuthenticationPrincipal Teacher teacher) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(teacher.getEmail())));
    }

    /**
     * GET /api/teacher/students
     * Returns all students enrolled in batches that have courses assigned to this teacher.
     * Used by Attendance page — avoids calling the admin-only /api/admin/students endpoint.
     */
    @Transactional
    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyStudents(
            @AuthenticationPrincipal Teacher teacher) {

        Long orgId = teacher.getOrganizationId();
        // Get all courses taught by this teacher
        List<Course> myCourses = courseRepository.findByTeacherAndOrganizationId(teacher, orgId);
        Set<Long> courseIds = myCourses.stream()
                .map(Course::getId).collect(java.util.stream.Collectors.toSet());

        // Collect all students from batches linked to those courses (deduplicated)
        Set<Long> seen = new java.util.HashSet<>();
        List<Map<String, Object>> students = new java.util.ArrayList<>();

        batchRepository.findByOrganizationId(orgId).stream()
                .filter(b -> (b.getCourse() != null && courseIds.contains(b.getCourse().getId()))
                        || (b.getCourses() != null && b.getCourses().stream().anyMatch(bc -> courseIds.contains(bc.getId()))))
                .flatMap(b -> b.getStudents().stream())
                .forEach(s -> {
                    if (seen.add(s.getId())) {
                        Map<String, Object> m = new java.util.LinkedHashMap<>();
                        m.put("id",         s.getId());
                        m.put("name",       s.getName());
                        m.put("userId",     s.getUserId());
                        m.put("email",      s.getEmail());
                        m.put("department", s.getDepartment());
                        students.add(m);
                    }
                });

        return ResponseEntity.ok(ApiResponse.ok(students));
    }
    @Transactional
    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipientEmail().equals(teacher.getEmail())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }

    @Transactional
    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsRead(
            @AuthenticationPrincipal Teacher teacher) {
        notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(teacher.getEmail())
                .forEach(n -> { n.setRead(true); notificationRepository.save(n); });
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }
 // ══════════════════════════════════════════════════════════════════════════
    // ── EXAM MANAGEMENT ───────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    /** GET /api/teacher/exams?courseId=X  — all exams for a course */
    @Transactional
    @GetMapping("/exams")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getExams(
            @RequestParam Long courseId,
            @AuthenticationPrincipal Teacher teacher) {

        List<Exam> exams = examRepository.findByTeacherAndCourseId(teacher, courseId);
        List<Map<String, Object>> result = exams.stream()
                .map(e -> buildExamMap(e, false))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** GET /api/teacher/exams/{id}  — single exam with student list */
    @Transactional
    @GetMapping("/exams/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExam(@PathVariable Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        return ResponseEntity.ok(ApiResponse.ok(buildExamMap(exam, true)));
    }

    /**
     * POST /api/teacher/exams  — create exam
     * Body: {
     *   courseId, title, examType, scheduledAt, durationMinutes, maxMarks, passMarks,
     *   levelUpScore, cleanupScore, questionPaperUrl (opt),
     *   studentMode: "ALL" | "SELECTED",
     *   unrecommendedStudentIds: [..] (used when mode=SELECTED),
     *   selectedStudentIds: [..] (for normal invited; required when mode=SELECTED)
     * }
     */
    @Transactional
    @PostMapping("/exams")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createExam(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {

        Long courseId = Long.valueOf(body.get("courseId").toString());
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (!course.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your course", null));

        // Resolve batch for this course
        com.zenelait.lms.entity.Batch batch = batchRepository.findAll().stream()
                .filter(b -> b.getCourse() != null && b.getCourse().getId().equals(courseId))
                .findFirst().orElse(null);

        Exam.ExamType examType;
        try { examType = Exam.ExamType.valueOf((String) body.get("examType")); }
        catch (Exception e) { examType = Exam.ExamType.OTHER; }

        String scheduledAtStr = (String) body.get("scheduledAt");
        LocalDateTime scheduledAt = scheduledAtStr != null ? LocalDateTime.parse(scheduledAtStr) : null;

        Exam exam = Exam.builder()
                .title((String) body.get("title"))
                .examType(examType)
                .course(course)
                .teacher(teacher)
                .department(teacher.getDepartment())
                .batchName(batch != null ? batch.getName() : null)
                .batchId(batch != null ? batch.getId() : null)
                .scheduledAt(scheduledAt)
                .durationMinutes(body.containsKey("durationMinutes") ? Integer.valueOf(body.get("durationMinutes").toString()) : 60)
                .maxMarks(body.containsKey("maxMarks") ? Integer.valueOf(body.get("maxMarks").toString()) : 100)
                .passMarks(body.containsKey("passMarks") ? Integer.valueOf(body.get("passMarks").toString()) : 40)
                .levelUpScore(body.containsKey("levelUpScore") && body.get("levelUpScore") != null ? Integer.valueOf(body.get("levelUpScore").toString()) : null)
                .cleanupScore(body.containsKey("cleanupScore") && body.get("cleanupScore") != null ? Integer.valueOf(body.get("cleanupScore").toString()) : null)
                .questionPaperUrl(body.containsKey("questionPaperUrl") ? (String) body.get("questionPaperUrl") : null)
                .status(Exam.ExamStatus.UPCOMING)
                .allStudents("ALL".equals(body.get("studentMode")))
                .build();

        examRepository.save(exam);

        // ── Collect all course students (via batch)
        Set<Long> seen = new HashSet<>();
        List<Student> allCourseStudents = new ArrayList<>();
        batchRepository.findAll().stream()
                .filter(b -> b.getCourse() != null && b.getCourse().getId().equals(courseId))
                .flatMap(b -> b.getStudents().stream())
                .forEach(s -> { if (seen.add(s.getId())) allCourseStudents.add(s); });

        boolean modeAll = "ALL".equals(body.get("studentMode"));

        if (modeAll) {
            // All students invited (none unrecommended)
            for (Student s : allCourseStudents) {
                examStudentRepository.save(ExamStudent.builder()
                        .exam(exam).student(s).unrecommended(false).build());
            }
        } else {
            // SELECTED mode
            @SuppressWarnings("unchecked")
            List<Object> unrecomIds = body.containsKey("unrecommendedStudentIds")
                    ? (List<Object>) body.get("unrecommendedStudentIds") : List.of();
            Set<Long> unrecomSet = unrecomIds.stream()
                    .map(o -> Long.valueOf(o.toString())).collect(Collectors.toSet());

            for (Student s : allCourseStudents) {
                boolean unr = unrecomSet.contains(s.getId());
                examStudentRepository.save(ExamStudent.builder()
                        .exam(exam).student(s).unrecommended(unr).build());
            }
        }

        // ── Notifications
        notificationService.onExamCreated(exam, allCourseStudents,
                teacher.getName(), teacher.getEmail(),
                course.getTitle(), batch != null ? batch.getName() : "—",
                modeAll);

        return ResponseEntity.ok(ApiResponse.ok("Exam created", buildExamMap(exam, true)));
    }

    /** PATCH /api/teacher/exams/{id}/start  — start exam instantly, optional question paper */
    @Transactional
    @PatchMapping("/exams/{id}/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startExam(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody(required = false) Map<String, Object> body) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        if (!exam.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your exam", null));

        if (body != null && body.containsKey("questionPaperUrl"))
            exam.setQuestionPaperUrl((String) body.get("questionPaperUrl"));

        exam.setStatus(Exam.ExamStatus.CURRENT);
        exam.setStartedAt(LocalDateTime.now());
        examRepository.save(exam);

        // Notify students + parents + admins
        List<ExamStudent> participants = examStudentRepository.findByExamId(id)
                .stream().filter(es -> !es.isUnrecommended()).collect(Collectors.toList());
        notificationService.onExamStarted(exam, participants,
                teacher.getName(), teacher.getEmail());

        return ResponseEntity.ok(ApiResponse.ok("Exam started", buildExamMap(exam, false)));
    }

    /** PATCH /api/teacher/exams/{id}/postpone  — postpone exam */
    @Transactional
    @PatchMapping("/exams/{id}/postpone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> postponeExam(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        if (!exam.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your exam", null));

        String postponedToStr = (String) body.get("postponedTo");
        LocalDateTime newDate = postponedToStr != null ? LocalDateTime.parse(postponedToStr) : null;

        exam.setStatus(Exam.ExamStatus.POSTPONED);
        exam.setPostponedTo(newDate);
        examRepository.save(exam);

        List<ExamStudent> participants = examStudentRepository.findByExamId(id);
        notificationService.onExamPostponed(exam, participants,
                teacher.getName(), teacher.getEmail());

        return ResponseEntity.ok(ApiResponse.ok("Exam postponed", buildExamMap(exam, false)));
    }

    /** PATCH /api/teacher/exams/{id}/cancel  — cancel exam with reason */
    @Transactional
    @PatchMapping("/exams/{id}/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelExam(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        if (!exam.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your exam", null));

        exam.setStatus(Exam.ExamStatus.CANCELLED);
        exam.setCancellationReason((String) body.getOrDefault("reason", "Cancelled by teacher"));
        examRepository.save(exam);

        List<ExamStudent> participants = examStudentRepository.findByExamId(id)
                .stream().filter(es -> !es.isUnrecommended()).collect(Collectors.toList());
        notificationService.onExamCancelled(exam, participants,
                teacher.getName(), teacher.getEmail());

        return ResponseEntity.ok(ApiResponse.ok("Exam cancelled", buildExamMap(exam, false)));
    }

    /** DELETE /api/teacher/exams/{id}  — hard delete exam */
    @Transactional
    @DeleteMapping("/exams/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        if (!exam.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your exam", null));

        // Notify students + parents before deleting
        List<ExamStudent> participants = examStudentRepository.findByExamId(id)
                .stream().filter(es -> !es.isUnrecommended()).collect(Collectors.toList());
        notificationService.onExamDeleted(exam, participants,
                teacher.getName(), teacher.getEmail());

        examResultRepository.deleteByExamId(id);
        examStudentRepository.deleteByExamId(id);
        examRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Exam deleted", null));
    }

    /** PATCH /api/teacher/exams/{id}/end  — timer ended, move to EVALUATING */
    @Transactional
    @PatchMapping("/exams/{id}/end")
    public ResponseEntity<ApiResponse<Map<String, Object>>> endExam(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        if (!exam.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your exam", null));

        exam.setStatus(Exam.ExamStatus.EVALUATING);
        exam.setEndedAt(LocalDateTime.now());
        examRepository.save(exam);
        return ResponseEntity.ok(ApiResponse.ok("Exam moved to evaluating", buildExamMap(exam, false)));
    }

    /** GET /api/teacher/exams/{id}/results  — get saved results for evaluating */
    @Transactional
    @GetMapping("/exams/{id}/results")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getExamResults(
            @PathVariable Long id) {

        List<ExamResult> results = examResultRepository.findByExamId(id);
        List<Map<String, Object>> out = results.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            r.getId());
            m.put("studentId",     r.getStudent().getId());
            m.put("studentName",   r.getStudent().getName());
            m.put("studentUserId", r.getStudent().getUserId());
            m.put("marksObtained", r.getMarksObtained());
            m.put("grade",         r.getGrade());
            m.put("attended",      r.isAttended());
            m.put("cleared",       r.isCleared());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(out));
    }

    /**
     * POST /api/teacher/exams/{id}/evaluate  — save (intermediate) evaluation rows
     * Body: { results: [{studentId, marksObtained, grade, attended, cleared}] }
     */
    @Transactional
    @PostMapping("/exams/{id}/evaluate")
    public ResponseEntity<ApiResponse<Void>> saveEvaluation(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        if (!exam.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your exam", null));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("results");
        upsertResults(exam, rows);
        return ResponseEntity.ok(ApiResponse.ok("Evaluation saved", null));
    }

    /**
     * PATCH /api/teacher/exams/{id}/finish  — finish evaluation:
     *   - moves exam → COMPLETED
     *   - notifies students/parents/admin
     *   - if some students didn't clear → create rescheduled clone exam
     */
    @Transactional
    @PatchMapping("/exams/{id}/finish")
    public ResponseEntity<ApiResponse<Map<String, Object>>> finishEvaluation(
            @PathVariable Long id,
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        if (!exam.getTeacher().getId().equals(teacher.getId()))
            return ResponseEntity.status(403).body(ApiResponse.ok("Not your exam", null));

        // Save final results
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("results");
        upsertResults(exam, rows);

        exam.setStatus(Exam.ExamStatus.COMPLETED);
        examRepository.save(exam);

        List<ExamResult> results = examResultRepository.findByExamId(id);

        // Notify everyone about completion
        List<ExamStudent> allParticipants = examStudentRepository.findByExamId(id)
                .stream().filter(es -> !es.isUnrecommended()).collect(Collectors.toList());
        notificationService.onExamFinished(exam, results, allParticipants,
                teacher.getName(), teacher.getEmail());

        // ── Reschedule for failed students ─────────────────────────────────────
        List<Student> failed = results.stream()
                .filter(r -> !r.isCleared() && r.isAttended())
                .map(ExamResult::getStudent)
                .collect(Collectors.toList());

        Exam rescheduled = null;
        if (!failed.isEmpty()) {
            rescheduled = Exam.builder()
                    .title("Rescheduled — " + exam.getTitle())
                    .examType(exam.getExamType())
                    .course(exam.getCourse())
                    .teacher(teacher)
                    .department(exam.getDepartment())
                    .batchName(exam.getBatchName())
                    .batchId(exam.getBatchId())
                    .scheduledAt(null)
                    .durationMinutes(exam.getDurationMinutes())
                    .maxMarks(exam.getMaxMarks())
                    .passMarks(exam.getPassMarks())
                    .levelUpScore(exam.getLevelUpScore())
                    .cleanupScore(exam.getCleanupScore())
                    .status(Exam.ExamStatus.RESCHEDULED)
                    .rescheduledFromId(exam.getId())
                    .allStudents(false)
                    .build();
            examRepository.save(rescheduled);

            for (Student s : failed) {
                examStudentRepository.save(ExamStudent.builder()
                        .exam(rescheduled).student(s).unrecommended(false).build());
            }

            notificationService.onExamRescheduled(rescheduled, failed,
                    teacher.getName(), teacher.getEmail(), exam.getTitle());
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("completed", buildExamMap(exam, false));
        if (rescheduled != null) resp.put("rescheduled", buildExamMap(rescheduled, false));
        return ResponseEntity.ok(ApiResponse.ok("Evaluation finished", resp));
    }

    // ── Helper: build exam response map ──────────────────────────────────────
    private Map<String, Object> buildExamMap(Exam e, boolean withStudents) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                  e.getId());
        m.put("title",               e.getTitle());
        m.put("examType",            e.getExamType().name());
        m.put("status",              e.getStatus().name());
        m.put("department",          e.getDepartment());
        m.put("batchName",           e.getBatchName());
        m.put("batchId",             e.getBatchId());
        m.put("scheduledAt",         e.getScheduledAt() != null ? e.getScheduledAt().toString() : null);
        m.put("durationMinutes",     e.getDurationMinutes());
        m.put("maxMarks",            e.getMaxMarks());
        m.put("passMarks",           e.getPassMarks());
        m.put("levelUpScore",        e.getLevelUpScore());
        m.put("cleanupScore",        e.getCleanupScore());
        m.put("questionPaperUrl",    e.getQuestionPaperUrl());
        m.put("allStudents",         e.isAllStudents());
        m.put("postponedTo",         e.getPostponedTo() != null ? e.getPostponedTo().toString() : null);
        m.put("cancellationReason",  e.getCancellationReason());
        m.put("rescheduledFromId",   e.getRescheduledFromId());
        m.put("startedAt",           e.getStartedAt() != null ? e.getStartedAt().toString() : null);
        m.put("endedAt",             e.getEndedAt() != null ? e.getEndedAt().toString() : null);
        m.put("createdAt",           e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);

        // course stub
        if (e.getCourse() != null) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("id",    e.getCourse().getId());
            c.put("title", e.getCourse().getTitle());
            m.put("course", c);
        }

        if (withStudents) {
            List<Map<String, Object>> students = examStudentRepository.findByExamId(e.getId())
                    .stream().map(es -> {
                        Map<String, Object> sm = new LinkedHashMap<>();
                        sm.put("studentId",      es.getStudent().getId());
                        sm.put("studentName",    es.getStudent().getName());
                        sm.put("studentUserId",  es.getStudent().getUserId());
                        sm.put("unrecommended",  es.isUnrecommended());
                        return sm;
                    }).collect(Collectors.toList());
            m.put("students", students);
        }
        return m;
    }

    // ── Helper: upsert exam results ───────────────────────────────────────────
    private void upsertResults(Exam exam, List<Map<String, Object>> rows) {
        if (rows == null) return;
        // Build existing map by studentId
        Map<Long, ExamResult> existing = examResultRepository.findByExamId(exam.getId())
                .stream().collect(Collectors.toMap(r -> r.getStudent().getId(), r -> r));

        for (Map<String, Object> row : rows) {
            Long studentId = Long.valueOf(row.get("studentId").toString());
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

            ExamResult result = existing.getOrDefault(studentId,
                    ExamResult.builder().exam(exam).student(student).build());

            if (row.containsKey("marksObtained") && row.get("marksObtained") != null)
                result.setMarksObtained(Integer.valueOf(row.get("marksObtained").toString()));
            if (row.containsKey("grade"))
                result.setGrade((String) row.get("grade"));
            if (row.containsKey("attended"))
                result.setAttended(Boolean.parseBoolean(row.get("attended").toString()));
            if (row.containsKey("cleared"))
                result.setCleared(Boolean.parseBoolean(row.get("cleared").toString()));
            result.setGradedAt(LocalDateTime.now());
            examResultRepository.save(result);
        }
    }

    @GetMapping("/performance/reviews")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeacherPerformanceReviews(
            @AuthenticationPrincipal Teacher teacher) {
        
        if (teacher == null) {
            return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
        }
        
        List<TeacherReview> reviews = teacherReviewRepository.findByTeacherIdOrderByCreatedAtDesc(teacher.getId());
        
        Double avgRating = teacherReviewRepository.getAverageRatingForTeacher(teacher.getId());
        if (avgRating == null) {
            avgRating = 0.0;
        }
        
        // Count distribution of stars (1 to 5)
        Map<Integer, Long> starCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            starCounts.put(i, 0L);
        }
        for (TeacherReview r : reviews) {
            int rating = r.getRating();
            starCounts.put(rating, starCounts.getOrDefault(rating, 0L) + 1);
        }
        
        // Convert reviews list to clean Map list
        List<Map<String, Object>> reviewsList = reviews.stream()
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("rating", r.getRating());
                    m.put("reviewText", r.getReviewText());
                    m.put("createdAt", r.getCreatedAt().toString());
                    m.put("studentName", r.getStudent() != null ? r.getStudent().getName() : "Anonymous");
                    return m;
                })
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("averageRating", avgRating);
        response.put("totalReviews", reviews.size());
        response.put("starDistribution", starCounts);
        response.put("reviews", reviewsList);
        
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/certificates")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> issueCertificate(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {
        
        if (teacher == null) {
            return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
        }
        
        Long studentId = Long.valueOf(body.get("studentId").toString());
        Long courseId = Long.valueOf(body.get("courseId").toString());
        String grade = (String) body.getOrDefault("grade", "A");
        String remarks = (String) body.getOrDefault("remarks", "Outstanding Performance");
        
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        
        // Check if certificate already exists to prevent duplicate issuance!
        if (certificateRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            return ResponseEntity.badRequest().body(ApiResponse.ok("Certificate already issued for this course", null));
        }
        
        Certificate certificate = Certificate.builder()
                .student(student)
                .course(course)
                .teacher(teacher)
                .grade(grade)
                .remarks(remarks)
                .issueDate(LocalDate.now())
                .build();
        
        certificateRepository.save(certificate);
        
        // Return details
        Map<String, Object> resp = new HashMap<>();
        resp.put("certificateId", certificate.getId());
        resp.put("certificateNumber", certificate.getCertificateNumber());
        resp.put("studentName", student.getName());
        resp.put("courseTitle", course.getTitle());
        resp.put("issueDate", certificate.getIssueDate().toString());
        
        return ResponseEntity.ok(ApiResponse.ok("Certificate issued successfully", resp));
    }

    @GetMapping("/certificates")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getIssuedCertificates(
            @AuthenticationPrincipal Teacher teacher) {
        
        if (teacher == null) {
            return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
        }
        
        List<Certificate> certs = certificateRepository.findByTeacherIdOrderByIssueDateDesc(teacher.getId());
        
        List<Map<String, Object>> result = certs.stream()
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("certificateNumber", c.getCertificateNumber());
                    m.put("studentName", c.getStudent() != null ? c.getStudent().getName() : "Unknown");
                    m.put("courseTitle", c.getCourse() != null ? c.getCourse().getTitle() : "—");
                    m.put("grade", c.getGrade());
                    m.put("remarks", c.getRemarks());
                    m.put("issueDate", c.getIssueDate().toString());
                    return m;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── ASSESSMENT SYSTEM APIS ───────────────────────────────────────────

    @PostMapping("/assessments")
    @Transactional
    public ResponseEntity<ApiResponse<Assessment>> createAssessment(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {
        Long courseId = Long.valueOf(body.get("courseId").toString());
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        Assessment assessment = Assessment.builder()
                .title((String) body.get("title"))
                .course(course)
                .teacher(teacher)
                .assessmentType((String) body.get("assessmentType"))
                .totalMarks(body.get("totalMarks") != null ? Double.valueOf(body.get("totalMarks").toString()) : 0.0)
                .passMarks(body.get("passMarks") != null ? Double.valueOf(body.get("passMarks").toString()) : 0.0)
                .durationMinutes(body.get("durationMinutes") != null ? Integer.valueOf(body.get("durationMinutes").toString()) : 60)
                .instructions((String) body.get("instructions"))
                .startDate(body.get("startDate") != null && !body.get("startDate").toString().isEmpty()
                        ? LocalDateTime.parse((String) body.get("startDate")) : null)
                .endDate(body.get("endDate") != null && !body.get("endDate").toString().isEmpty()
                        ? LocalDateTime.parse((String) body.get("endDate")) : null)
                .shuffleQuestions(body.get("shuffleQuestions") != null ? Boolean.parseBoolean(body.get("shuffleQuestions").toString()) : false)
                .showResultImmediately(body.get("showResultImmediately") != null ? Boolean.parseBoolean(body.get("showResultImmediately").toString()) : true)
                .status(body.get("status") != null ? (String) body.get("status") : "DRAFT")
                .assignedStudentIds((String) body.get("assignedStudentIds"))
                .organizationId(teacher.getOrganizationId())
                .build();

        assessmentRepository.save(assessment);

        // Add questions
        if (body.containsKey("questions")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> qList = (List<Map<String, Object>>) body.get("questions");
            for (Map<String, Object> qMap : qList) {
                AssessmentQuestion q = AssessmentQuestion.builder()
                        .assessment(assessment)
                        .questionText((String) qMap.get("questionText"))
                        .questionType((String) qMap.get("questionType"))
                        .optionsJson((String) qMap.get("optionsJson"))
                        .correctAnswer((String) qMap.get("correctAnswer"))
                        .modelAnswer((String) qMap.get("modelAnswer"))
                        .marks(qMap.get("marks") != null ? Double.valueOf(qMap.get("marks").toString()) : 1.0)
                        .difficulty((String) qMap.get("difficulty"))
                        .imageUrl((String) qMap.get("imageUrl"))
                        .build();
                assessmentQuestionRepository.save(q);
            }
        }

        return ResponseEntity.ok(ApiResponse.ok("Assessment created successfully", assessment));
    }

    @GetMapping("/assessments")
    public ResponseEntity<ApiResponse<List<Assessment>>> getAssessments(
            @AuthenticationPrincipal Teacher teacher,
            @RequestParam Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok(assessmentRepository.findByTeacherAndCourseId(teacher, courseId)));
    }

    @GetMapping("/assessments/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssessment(
            @PathVariable Long id) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
        List<AssessmentQuestion> questions = assessmentQuestionRepository.findByAssessmentId(id);
        Map<String, Object> res = new HashMap<>();
        res.put("assessment", assessment);
        res.put("questions", questions);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @GetMapping("/assessments/{id}/questions")
    public ResponseEntity<ApiResponse<List<AssessmentQuestion>>> getAssessmentQuestions(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(assessmentQuestionRepository.findByAssessmentId(id)));
    }

    @PostMapping("/assessments/{id}/questions")
    @Transactional
    public ResponseEntity<ApiResponse<AssessmentQuestion>> addAssessmentQuestion(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));

        AssessmentQuestion q = AssessmentQuestion.builder()
                .assessment(assessment)
                .questionText((String) body.get("questionText"))
                .questionType((String) body.get("questionType"))
                .optionsJson((String) body.get("optionsJson"))
                .correctAnswer((String) body.get("correctAnswer"))
                .modelAnswer((String) body.get("modelAnswer"))
                .marks(body.get("marks") != null ? Double.valueOf(body.get("marks").toString()) : 1.0)
                .difficulty((String) body.get("difficulty"))
                .imageUrl((String) body.get("imageUrl"))
                .build();

        assessmentQuestionRepository.save(q);
        return ResponseEntity.ok(ApiResponse.ok("Question added successfully", q));
    }

    @PutMapping("/assessments/{id}/questions/{questionId}")
    @Transactional
    public ResponseEntity<ApiResponse<AssessmentQuestion>> updateAssessmentQuestion(
            @PathVariable Long id,
            @PathVariable Long questionId,
            @RequestBody Map<String, Object> body) {
        AssessmentQuestion q = assessmentQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        q.setQuestionText((String) body.get("questionText"));
        q.setQuestionType((String) body.get("questionType"));
        q.setOptionsJson((String) body.get("optionsJson"));
        q.setCorrectAnswer((String) body.get("correctAnswer"));
        q.setModelAnswer((String) body.get("modelAnswer"));
        q.setMarks(body.get("marks") != null ? Double.valueOf(body.get("marks").toString()) : 1.0);
        q.setDifficulty((String) body.get("difficulty"));
        q.setImageUrl((String) body.get("imageUrl"));

        assessmentQuestionRepository.save(q);
        return ResponseEntity.ok(ApiResponse.ok("Question updated successfully", q));
    }

    @DeleteMapping("/assessments/{id}/questions/{questionId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteAssessmentQuestion(
            @PathVariable Long id,
            @PathVariable Long questionId) {
        assessmentQuestionRepository.deleteById(questionId);
        return ResponseEntity.ok(ApiResponse.ok("Question deleted successfully", null));
    }

    @PutMapping("/assessments/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Assessment>> updateAssessment(
            @AuthenticationPrincipal Teacher teacher,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));

        assessment.setTitle((String) body.get("title"));
        assessment.setAssessmentType((String) body.get("assessmentType"));
        assessment.setTotalMarks(body.get("totalMarks") != null ? Double.valueOf(body.get("totalMarks").toString()) : 0.0);
        assessment.setPassMarks(body.get("passMarks") != null ? Double.valueOf(body.get("passMarks").toString()) : 0.0);
        assessment.setDurationMinutes(body.get("durationMinutes") != null ? Integer.valueOf(body.get("durationMinutes").toString()) : 60);
        assessment.setInstructions((String) body.get("instructions"));
        assessment.setStartDate(body.get("startDate") != null && !body.get("startDate").toString().isEmpty()
                ? LocalDateTime.parse((String) body.get("startDate")) : null);
        assessment.setEndDate(body.get("endDate") != null && !body.get("endDate").toString().isEmpty()
                ? LocalDateTime.parse((String) body.get("endDate")) : null);
        assessment.setShuffleQuestions(body.get("shuffleQuestions") != null ? Boolean.parseBoolean(body.get("shuffleQuestions").toString()) : false);
        assessment.setShowResultImmediately(body.get("showResultImmediately") != null ? Boolean.parseBoolean(body.get("showResultImmediately").toString()) : true);
        assessment.setStatus(body.get("status") != null ? (String) body.get("status") : "DRAFT");
        assessment.setAssignedStudentIds((String) body.get("assignedStudentIds"));

        assessmentRepository.save(assessment);

        // Delete existing questions and replace only if new questions list is supplied
        if (body.containsKey("questions")) {
            assessmentQuestionRepository.deleteByAssessmentId(id);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> qList = (List<Map<String, Object>>) body.get("questions");
            for (Map<String, Object> qMap : qList) {
                AssessmentQuestion q = AssessmentQuestion.builder()
                        .assessment(assessment)
                        .questionText((String) qMap.get("questionText"))
                        .questionType((String) qMap.get("questionType"))
                        .optionsJson((String) qMap.get("optionsJson"))
                        .correctAnswer((String) qMap.get("correctAnswer"))
                        .modelAnswer((String) qMap.get("modelAnswer"))
                        .marks(qMap.get("marks") != null ? Double.valueOf(qMap.get("marks").toString()) : 1.0)
                        .difficulty((String) qMap.get("difficulty"))
                        .imageUrl((String) qMap.get("imageUrl"))
                        .build();
                assessmentQuestionRepository.save(q);
            }
        }

        return ResponseEntity.ok(ApiResponse.ok("Assessment updated successfully", assessment));
    }

    @DeleteMapping("/assessments/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteAssessment(@PathVariable Long id) {
        assessmentQuestionRepository.deleteByAssessmentId(id);
        assessmentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Assessment deleted successfully", null));
    }

    @GetMapping("/assessments/{id}/submissions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAssessmentSubmissions(
            @PathVariable Long id) {
        List<AssessmentAttempt> attempts = assessmentAttemptRepository.findByAssessmentId(id);
        List<Map<String, Object>> res = attempts.stream().map(att -> {
            Map<String, Object> m = new HashMap<>();
            m.put("attemptId", att.getId());
            m.put("studentId", att.getStudent().getId());
            m.put("studentName", att.getStudent().getName());
            m.put("studentUserId", att.getStudent().getUserId());
            m.put("startedAt", att.getStartedAt() != null ? att.getStartedAt().toString() : null);
            m.put("submittedAt", att.getSubmittedAt() != null ? att.getSubmittedAt().toString() : null);
            m.put("status", att.getStatus());
            m.put("totalScore", att.getTotalScore());
            m.put("tabSwitchCount", att.getTabSwitchCount());
            m.put("gradedAt", att.getGradedAt() != null ? att.getGradedAt().toString() : null);
            m.put("feedback", att.getFeedback());
            m.put("resultsPublished", att.isResultsPublished());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @GetMapping("/assessments/attempts/{attemptId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssessmentAttemptDetails(
            @PathVariable Long attemptId) {
        AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));
        List<AssessmentAnswer> answers = assessmentAnswerRepository.findByAttemptId(attemptId);
        Map<String, Object> res = new HashMap<>();
        res.put("attempt", attempt);
        res.put("answers", answers);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping("/assessments/attempts/{attemptId}/grade")
    @Transactional
    public ResponseEntity<ApiResponse<AssessmentAttempt>> gradeAssessmentAttempt(
            @PathVariable Long attemptId,
            @RequestBody Map<String, Object> body) {
        AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> gradesList = (List<Map<String, Object>>) body.get("grades");
        double calculatedTotal = 0.0;
        for (Map<String, Object> g : gradesList) {
             Long answerId = Long.valueOf(g.get("answerId").toString());
             AssessmentAnswer answer = assessmentAnswerRepository.findById(answerId)
                     .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));
             double marks = Double.parseDouble(g.get("marks").toString());
             answer.setMarksObtained(marks);
             if (g.containsKey("feedback")) {
                 answer.setTeacherFeedback((String) g.get("feedback"));
             }
             assessmentAnswerRepository.save(answer);
             calculatedTotal += marks;
        }

        attempt.setTotalScore(calculatedTotal);
        attempt.setStatus("GRADED");
        attempt.setGradedAt(LocalDateTime.now());
        if (body.containsKey("feedback")) {
            attempt.setFeedback((String) body.get("feedback"));
        }
        assessmentAttemptRepository.save(attempt);

        // Send notification to student
        Notification notification = Notification.builder()
                .recipientEmail(attempt.getStudent().getEmail())
                .title("Assessment Graded")
                .message("Your attempt for the assessment \"" + attempt.getAssessment().getTitle() + "\" has been graded.")
                .build();
        notificationRepository.save(notification);

        return ResponseEntity.ok(ApiResponse.ok("Assessment attempt graded successfully", attempt));
    }

    @PostMapping("/assessments/attempts/{attemptId}/answers/{answerId}/grade")
    @Transactional
    public ResponseEntity<ApiResponse<AssessmentAnswer>> gradeAssessmentAnswer(
            @PathVariable Long attemptId,
            @PathVariable Long answerId,
            @RequestBody Map<String, Object> body) {
        AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        AssessmentAnswer answer = assessmentAnswerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        if (body.containsKey("marksObtained")) {
            answer.setMarksObtained(Double.parseDouble(body.get("marksObtained").toString()));
        }
        if (body.containsKey("teacherFeedback")) {
            answer.setTeacherFeedback((String) body.get("teacherFeedback"));
        }
        assessmentAnswerRepository.save(answer);

        // Recalculate total score for the attempt
        List<AssessmentAnswer> answers = assessmentAnswerRepository.findByAttemptId(attemptId);
        double totalScore = 0.0;
        boolean allGraded = true;
        for (AssessmentAnswer ans : answers) {
            if (ans.getMarksObtained() != null) {
                totalScore += ans.getMarksObtained();
            } else {
                allGraded = false;
            }
        }
        attempt.setTotalScore(totalScore);
        if (allGraded) {
            attempt.setStatus("GRADED");
            attempt.setGradedAt(LocalDateTime.now());
        }
        assessmentAttemptRepository.save(attempt);

        return ResponseEntity.ok(ApiResponse.ok("Answer graded successfully", answer));
    }

    @PostMapping("/assessments/{id}/publish-results")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> publishAssessmentResults(
            @PathVariable Long id) {
        List<AssessmentAttempt> attempts = assessmentAttemptRepository.findByAssessmentId(id);
        for (AssessmentAttempt att : attempts) {
            att.setResultsPublished(true);
            assessmentAttemptRepository.save(att);

            // Send notification to student
            Notification notification = Notification.builder()
                    .recipientEmail(att.getStudent().getEmail())
                    .title("Results Published")
                    .message("Results for the assessment \"" + att.getAssessment().getTitle() + "\" are now available.")
                    .build();
            notificationRepository.save(notification);
        }
        return ResponseEntity.ok(ApiResponse.ok("Results published to all students", null));
    }

    @GetMapping("/assessments/{id}/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssessmentAnalytics(
            @PathVariable Long id) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
        List<AssessmentAttempt> attempts = assessmentAttemptRepository.findByAssessmentId(id);

        double sum = 0.0;
        double high = 0.0;
        double low = assessment.getTotalMarks() != null ? assessment.getTotalMarks() : 100.0;
        int passedCount = 0;
        int totalAttempts = attempts.size();

        for (AssessmentAttempt att : attempts) {
            double score = att.getTotalScore() != null ? att.getTotalScore() : 0.0;
            sum += score;
            if (score > high) high = score;
            if (score < low) low = score;
            if (assessment.getPassMarks() != null && score >= assessment.getPassMarks()) {
                passedCount++;
            }
        }

        double avg = totalAttempts > 0 ? sum / totalAttempts : 0.0;
        if (totalAttempts == 0) low = 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAttempts", totalAttempts);
        stats.put("averageScore", avg);
        stats.put("highScore", high);
        stats.put("lowScore", low);
        stats.put("passRate", totalAttempts > 0 ? (passedCount * 100.0 / totalAttempts) : 0.0);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    // ── QUESTION BANK APIS ───────────────────────────────────────────────

    @GetMapping("/question-bank")
    public ResponseEntity<ApiResponse<List<QuestionBank>>> getQuestionBank(
            @AuthenticationPrincipal Teacher teacher,
            @RequestParam(required = false) Long courseId) {
        if (courseId != null) {
            Course course = courseRepository.findById(courseId).orElse(null);
            return ResponseEntity.ok(ApiResponse.ok(questionBankRepository.findByTeacherAndCourse(teacher, course)));
        }
        return ResponseEntity.ok(ApiResponse.ok(questionBankRepository.findByTeacher(teacher)));
    }

    @PostMapping("/question-bank")
    public ResponseEntity<ApiResponse<QuestionBank>> saveToQuestionBank(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {
        Long courseId = body.containsKey("courseId") && body.get("courseId") != null
                ? Long.valueOf(body.get("courseId").toString()) : null;
        Course course = courseId != null ? courseRepository.findById(courseId).orElse(null) : null;

        QuestionBank q = QuestionBank.builder()
                .teacher(teacher)
                .course(course)
                .questionText((String) body.get("questionText"))
                .questionType((String) body.get("questionType"))
                .optionsJson((String) body.get("optionsJson"))
                .correctAnswer((String) body.get("correctAnswer"))
                .modelAnswer((String) body.get("modelAnswer"))
                .marks(body.get("marks") != null ? Double.valueOf(body.get("marks").toString()) : 1.0)
                .difficulty((String) body.get("difficulty"))
                .imageUrl((String) body.get("imageUrl"))
                .build();

        questionBankRepository.save(q);
        return ResponseEntity.ok(ApiResponse.ok("Saved to Question Bank", q));
    }

    @DeleteMapping("/question-bank/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFromQuestionBank(@PathVariable Long id) {
        questionBankRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Deleted from Question Bank", null));
    }

    // ── TASK TEMPLATES & OPERATIONS ──────────────────────────────────────

    @GetMapping("/task-templates")
    public ResponseEntity<ApiResponse<List<AssignmentTemplate>>> getTaskTemplates(
            @AuthenticationPrincipal Teacher teacher) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentTemplateRepository.findByTeacher(teacher)));
    }

    @PostMapping("/task-templates")
    public ResponseEntity<ApiResponse<AssignmentTemplate>> createTaskTemplate(
            @AuthenticationPrincipal Teacher teacher,
            @RequestBody Map<String, Object> body) {
        AssignmentTemplate template = AssignmentTemplate.builder()
                .teacher(teacher)
                .title((String) body.get("title"))
                .description((String) body.get("description"))
                .taskType((String) body.get("taskType"))
                .maxMarks(body.containsKey("maxMarks") && body.get("maxMarks") != null
                        ? Integer.parseInt(body.get("maxMarks").toString()) : 100)
                .submissionType((String) body.getOrDefault("submissionType", "ANY"))
                .build();
        assignmentTemplateRepository.save(template);
        return ResponseEntity.ok(ApiResponse.ok("Task template created", template));
    }

    @DeleteMapping("/task-templates/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTaskTemplate(@PathVariable Long id) {
        assignmentTemplateRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Template deleted", null));
    }

    @PostMapping("/submissions/{subId}/request-resubmission")
    @Transactional
    public ResponseEntity<ApiResponse<AssignmentSubmission>> requestResubmission(
            @PathVariable Long subId,
            @RequestBody Map<String, String> body) {
        AssignmentSubmission sub = submissionRepository.findById(subId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found: " + subId));

        sub.setStatus(AssignmentSubmission.SubmissionStatus.RESUBMISSION_REQUESTED);
        sub.setTeacherFeedback(body.getOrDefault("feedback", "Teacher requested resubmission. Please update and submit again."));
        submissionRepository.save(sub);

        // Notify student
        Notification notification = Notification.builder()
                .recipientEmail(sub.getStudent().getEmail())
                .title("Resubmission Requested")
                .message("Your teacher requested a resubmission for task \"" + sub.getAssignment().getTitle() + "\".")
                .build();
        notificationRepository.save(notification);

        return ResponseEntity.ok(ApiResponse.ok("Resubmission requested", sub));
    }

    @PostMapping("/assignments/{id}/bulk-extend")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> bulkExtendDeadline(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        LocalDateTime newDue = LocalDateTime.parse(body.get("newDueDate"));
        assignment.setDueDate(newDue);
        assignmentRepository.save(assignment);
        return ResponseEntity.ok(ApiResponse.ok("Deadline extended successfully", null));
    }

    @PostMapping("/assignments/{id}/remind")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> sendTaskReminder(
            @PathVariable Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        
        // Find all students in course who haven't submitted yet
        Set<Long> seen = new HashSet<>();
        List<Student> courseStudents = new ArrayList<>();
        batchRepository.findAll().stream()
                .filter(b -> b.getCourse() != null && b.getCourse().getId().equals(assignment.getCourse().getId()))
                .flatMap(b -> b.getStudents().stream())
                .forEach(s -> { if (seen.add(s.getId())) courseStudents.add(s); });

        for (Student student : courseStudents) {
            boolean submitted = submissionRepository.findByAssignmentAndStudent(assignment, student).isPresent();
            if (!submitted) {
                Notification notification = Notification.builder()
                        .recipientEmail(student.getEmail())
                        .title("Task Reminder")
                        .message("Reminder: \"" + assignment.getTitle() + "\" is due by " + assignment.getDueDate().toString())
                        .build();
                notificationRepository.save(notification);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok("Reminders sent successfully", null));
    }
}
