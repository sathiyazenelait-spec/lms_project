package com.zenelait.lms.controller;

import com.zenelait.lms.dto.request.AdminRegisterParentRequest;
import com.zenelait.lms.dto.request.AdminRegisterStudentRequest;
import com.zenelait.lms.dto.request.AdminRegisterTeacherRequest;
import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.dto.response.AuthResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.util.Safe;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.*;
import com.zenelait.lms.service.admin.DepartmentService;
import com.zenelait.lms.service.notification.NotificationService;
import com.zenelait.lms.service.parent.ParentAuthService;
import com.zenelait.lms.service.student.StudentAuthService;
import com.zenelait.lms.service.teacher.TeacherAuthService;
import com.zenelait.lms.service.subscription.SubscriptionService;
import com.zenelait.lms.exception.BadRequestException;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminController {

    private final AdminRepository        adminRepository;
    private final StudentRepository      studentRepository;
    private final TeacherRepository      teacherRepository;
    private final ParentRepository       parentRepository;
    private final CourseRepository       courseRepository;
    private final BatchRepository        batchRepository;
    private final FeeRepository          feeRepository;
    private final ForumPostRepository    forumPostRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final CourseMaterialRepository courseMaterialRepository;
    private final AttendanceRepository   attendanceRepository;
    private final AssignmentRepository   assignmentRepository;
    private final ExamRepository         examRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService    notificationService;
    private final AnnouncementRepository announcementRepository;
    private final DepartmentRepository   departmentRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final StudentAuthService studentAuthService;
    private final TeacherAuthService teacherAuthService;
    private final ParentAuthService parentAuthService;
    private final TeacherReviewRepository teacherReviewRepository;
    private final CourseEnrollmentRequestRepository courseEnrollmentRequestRepository;
    private final AdminCertificateRepository adminCertificateRepository;
    private final SubscriptionService        subscriptionService;

    // ── Dashboard Stats ──────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(@AuthenticationPrincipal Admin admin) {
        Long orgId = admin.getOrganizationId();
        long totalStudents     = orgId != null ? studentRepository.findByOrganizationId(orgId).size()            : studentRepository.count();
        long totalTeachers     = orgId != null ? teacherRepository.findByOrganizationId(orgId).size()            : teacherRepository.count();
        long totalParents      = orgId != null ? parentRepository.findByOrganizationId(orgId).size()             : parentRepository.count();
        long totalAdmins       = orgId != null ? adminRepository.findByOrganizationId(orgId).size()              : adminRepository.count();
        long thisMonthStudents = orgId != null ? studentRepository.getJoinThisMonthStudentsByOrg(orgId).size()   : studentRepository.getJoinThisMonthStudents().size();
        long totalCourses      = orgId != null ? courseRepository.countByOrganizationId(orgId)                   : courseRepository.count();
        long totalDepartments  = orgId != null ? departmentRepository.findByOrganizationId(orgId).size()         : departmentRepository.count();
        long activeCourses     = orgId != null ? courseRepository.findByOrganizationIdAndStatus(orgId, Course.CourseStatus.ACTIVE).size() : courseRepository.findByStatus(Course.CourseStatus.ACTIVE).size();
        long activeBatches     = orgId != null ? batchRepository.findByOrganizationIdAndStatus(orgId, Batch.BatchStatus.ACTIVE).size()   : batchRepository.findByStatus(Batch.BatchStatus.ACTIVE).size();
        java.math.BigDecimal revenueThisMonth = orgId != null
                ? feeRepository.getTotalRevenueThisMonthByOrg(orgId)
                : feeRepository.getTotalRevenueThisMonth();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "totalStudents",     totalStudents,
                "totalTeachers",     totalTeachers,
                "totalParents",      totalParents,
                "totalAdmins",       totalAdmins,
                "totalCourses",      totalCourses,
                "totalDepartments",  totalDepartments,
                "thisMonthStudents", thisMonthStudents,
                "revenueThisMonth",  revenueThisMonth != null ? revenueThisMonth : java.math.BigDecimal.ZERO,
                "activeCourses",     activeCourses,
                "activeBatches",     activeBatches
        )));
    }
    
    @PostMapping("/student/create")
    public ResponseEntity<ApiResponse<AuthResponse>> createStudentByAdmin(
            @AuthenticationPrincipal Admin admin,
            @Valid @RequestBody AdminRegisterStudentRequest req) {

        return ResponseEntity.ok(
            ApiResponse.ok("Student created successfully",
                studentAuthService.createByAdmin(req, admin))
        );
    }
    
    
    @PostMapping("/teacher/create")
    public ResponseEntity<ApiResponse<AuthResponse>> createTeacherByAdmin(@AuthenticationPrincipal Admin admin,@Valid @RequestBody AdminRegisterTeacherRequest req){
    	return ResponseEntity.ok(ApiResponse.ok(teacherAuthService.createByAdmin(req, admin)));
    }
    @PostMapping("/parent/create")
    public ResponseEntity<ApiResponse<AuthResponse>> createParentByAdmin(@AuthenticationPrincipal Admin admin, @Valid @RequestBody AdminRegisterParentRequest req){
    	return ResponseEntity.ok(ApiResponse.ok(parentAuthService.createByAdmin(req,admin)));
    }
    
    @GetMapping("/nonsuperadmin")
    public ResponseEntity<ApiResponse<List<Admin>>> getNonSuperAdmin( @AuthenticationPrincipal Admin admin) {
    	Long orgId = admin.getOrganizationId();
    	List<Admin> admins = orgId != null
                ? adminRepository.findByOrganizationIdAndSuperAdminFalse(orgId)
                : adminRepository.findBySuperAdminFalse();
        return ResponseEntity.ok(ApiResponse.ok(admins));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdmin(@PathVariable Long id) {
        adminRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Admin deleted", null));
    }
    // ── Admin Profile ─────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Admin>> getProfile(@AuthenticationPrincipal Admin admin) {
        return ResponseEntity.ok(ApiResponse.ok(admin));
    }
    
    @GetMapping("/revenue/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueSummary(
            @AuthenticationPrincipal Admin admin) {
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        Long orgId = admin.getOrganizationId();

        BigDecimal collected = Safe.get(
                orgId != null ? feeRepository.getTotalRevenueThisMonthByOrg(orgId) : feeRepository.getTotalRevenueThisMonth(),
                BigDecimal.ZERO);
        BigDecimal pending = Safe.get(
                orgId != null ? feeRepository.getTotalPendingAmountByOrg(orgId) : feeRepository.getTotalPendingAmount(),
                BigDecimal.ZERO);
        BigDecimal total = Safe.get(
                orgId != null ? feeRepository.getTotalBilledAmountByOrg(orgId) : feeRepository.getTotalBilledAmount(),
                BigDecimal.ZERO);

        // Monthly chart data for last 6 months
        List<Object[]> monthly = orgId != null
                ? feeRepository.getMonthlyRevenueByOrg(orgId, sixMonthsAgo)
                : feeRepository.getMonthlyRevenue(sixMonthsAgo);

        // Build ordered month label → amount map
        java.util.LinkedHashMap<String, BigDecimal> monthlyMap = new java.util.LinkedHashMap<>();
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MMM");
        for (int i = 5; i >= 0; i--) {
            String label = LocalDate.now().minusMonths(i).format(fmt);
            monthlyMap.put(label, BigDecimal.ZERO);
        }
        for (Object[] row : monthly) {
            int monthNum   = ((Number) row[0]).intValue();
            BigDecimal amt = (BigDecimal) row[1];
            for (int i = 5; i >= 0; i--) {
                LocalDate d = LocalDate.now().minusMonths(i);
                if (d.getMonthValue() == monthNum) {
                    monthlyMap.put(d.format(fmt), amt);
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "collected",    collected != null ? collected : BigDecimal.ZERO,
            "pending",      pending   != null ? pending   : BigDecimal.ZERO,
            "total",        total     != null ? total     : BigDecimal.ZERO,
            "monthlyChart", monthlyMap
        )));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Admin>> updateProfile(
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, String> body) {
        if (body.containsKey("name"))        admin.setName(body.get("name"));
        if (body.containsKey("phone"))       admin.setPhone(body.get("phone"));
        if (body.containsKey("address"))     admin.setAddress(body.get("address"));
        if (body.containsKey("academyName")) admin.setAcademyName(body.get("academyName"));
        if (body.containsKey("profilePicUrl"))  admin.setProfilePicUrl(body.get("profilePicUrl"));
        adminRepository.save(admin);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", admin));
    }

    // ── Student Management ────────────────────────────────────────────
    @Transactional
    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<Student>>> getAllStudents( @AuthenticationPrincipal Admin admin) {
    	Admin dbAdmin = adminRepository.findByEmail(admin.getEmail())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
    	
    	Long orgId = dbAdmin.getOrganizationId();

        return ResponseEntity.ok(
                ApiResponse.ok(
                        studentRepository.findByOrganizationId(orgId)
                )
        );
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<ApiResponse<Student>> getStudent(@PathVariable Long id) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        return ResponseEntity.ok(ApiResponse.ok(s));
    }

    @PatchMapping("/students/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> toggleStudent(
            @PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        s.setActive(body.getOrDefault("active", true));
        studentRepository.save(s);
        return ResponseEntity.ok(ApiResponse.ok("Student status updated", null));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        studentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Student deleted", null));
    }

    // ── Teacher Management ────────────────────────────────────────────
    @Transactional
    @GetMapping("/teachers")
    public ResponseEntity<ApiResponse<List<Teacher>>> getAllTeachers(@AuthenticationPrincipal Admin admin) {
    	Admin admins=adminRepository.findByEmail(admin.getEmail()).orElseThrow(()->new ResourceNotFoundException("admin not found: "));
    	Long OrgId=admins.getOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(teacherRepository.findByOrganizationId(OrgId)));
    }

    @GetMapping("/teachers/{id}")
    public ResponseEntity<ApiResponse<Teacher>> getTeacher(@PathVariable Long id) {
        Teacher t = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + id));
        return ResponseEntity.ok(ApiResponse.ok(t));
    }

    @PatchMapping("/teachers/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> toggleTeacher(
            @PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Teacher t = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + id));
        t.setActive(body.getOrDefault("active", true));
        teacherRepository.save(t);
        return ResponseEntity.ok(ApiResponse.ok("Teacher status updated", null));
    }

    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Long id) {
        teacherRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Teacher deleted", null));
    }

    // ── Parent Management ─────────────────────────────────────────────
    @GetMapping("/parents")
    public ResponseEntity<ApiResponse<List<Parent>>> getAllParents(@AuthenticationPrincipal Admin admin) {
    	Admin admins=adminRepository.findByEmail(admin.getEmail()).orElseThrow(()->new ResourceNotFoundException("Admin not found"));
    	Long orgId=admins.getOrganizationId();
    	
        return ResponseEntity.ok(ApiResponse.ok(parentRepository.findByOrganizationId(orgId)));
    }

    @DeleteMapping("/parents/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteParent(@PathVariable Long id) {
        parentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Parent deleted", null));
    }

    // ── Course Management ─────────────────────────────────────────────
    @Transactional
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllCourses(@AuthenticationPrincipal Admin admin) {
        Long orgId = admin.getOrganizationId();
        List<Course> courses = orgId != null ? courseRepository.findByOrganizationId(orgId) : courseRepository.findAll();
        // Heal any courses that have null status in DB (legacy data)
        courses.forEach(c -> {
            if (c.getStatus() == null) {
                c.setStatus(Course.CourseStatus.DRAFT);
                courseRepository.save(c);
            }
        });
        List<Map<String, Object>> result = courses.stream().map(course -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id",           course.getId());
            m.put("title",        course.getTitle());
            m.put("description",  course.getDescription());
            m.put("department",   course.getDepartment());
            m.put("durationHours",course.getDurationHours());
            // Null-safe status — should never be null after heal above, but defensive anyway
            m.put("status",       course.getStatus() != null ? course.getStatus().name() : "DRAFT");
            m.put("createdAt",    course.getCreatedAt());
            // Teacher info
            if (course.getTeacher() != null) {
                Map<String, Object> t = new java.util.LinkedHashMap<>();
                t.put("id",   course.getTeacher().getId());
                t.put("name", course.getTeacher().getName());
                m.put("teacher", t);
            } else {
                m.put("teacher", null);
            }
            // Find which batch(es) this course is assigned to
            List<Map<String, Object>> batches = batchRepository.findAll().stream()
            	    .filter(b -> {
            	        boolean inLegacy = b.getCourse() != null 
            	                        && b.getCourse().getId().equals(course.getId());
            	        boolean inManyToMany = b.getCourses() != null 
            	                        && b.getCourses().stream()
            	                           .anyMatch(c -> c.getId().equals(course.getId()));
            	        return inLegacy || inManyToMany;
            	    })
                   
                    .map(b -> {
                        Map<String, Object> bm = new java.util.LinkedHashMap<>();
                        bm.put("id",        b.getId());
                        bm.put("name",      b.getName());
                        bm.put("status",    b.getStatus().name());
                        bm.put("startDate", b.getStartDate() != null ? b.getStartDate().toString() : null);
                        bm.put("endDate",   b.getEndDate()   != null ? b.getEndDate().toString()   : null);
                        return bm;
                    })
                    .collect(java.util.stream.Collectors.toList());
            m.put("batches", batches);
            // Derive effective status from batch dates
            String effectiveStatus = course.getStatus() != null ? course.getStatus().name() : "DRAFT";
            if (!batches.isEmpty()) {
                java.time.LocalDate today = java.time.LocalDate.now();
                boolean anyActive = batches.stream().anyMatch(b -> "ACTIVE".equals(b.get("status")));
                boolean anyUpcoming = batches.stream().anyMatch(b -> "UPCOMING".equals(b.get("status")));
                if (anyActive) effectiveStatus = "ACTIVE";
                else if (anyUpcoming) effectiveStatus = "UPCOMING";
                else effectiveStatus = "COMPLETED";
            }
            m.put("effectiveStatus", effectiveStatus);
            return m;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Transactional
    @PostMapping("/courses")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCourse(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Admin admin) {
        // Determine status from batch if batchId provided, otherwise DRAFT
        Course.CourseStatus status = Course.CourseStatus.DRAFT;
        Batch assignedBatch = null;
        if (body.containsKey("batchId") && body.get("batchId") != null) {
            Long batchId = Long.valueOf(body.get("batchId").toString());
            assignedBatch = batchRepository.findById(batchId).orElse(null);
            if (assignedBatch != null) {
                // Auto-calculate status from batch dates
                java.time.LocalDate today = java.time.LocalDate.now();
                java.time.LocalDate start = assignedBatch.getStartDate();
                java.time.LocalDate end   = assignedBatch.getEndDate();
                if (start != null && end != null) {
                    if (!today.isBefore(start) && !today.isAfter(end)) {
                        status = Course.CourseStatus.ACTIVE;
                    } else if (today.isBefore(start)) {
                        status = Course.CourseStatus.DRAFT; // upcoming batch = draft course
                    } else {
                        status = Course.CourseStatus.INACTIVE; // past batch
                    }
                }
            }
        }
        log.debug("ORG ID: " + admin.getOrganizationId());

        Course course = Course.builder()
                .title((String) body.get("title"))
                .description((String) body.get("description"))
                .department((String) body.getOrDefault("department", assignedBatch != null ? assignedBatch.getDepartment() : null))
                .durationHours(body.containsKey("durationHours") ? Integer.valueOf(body.get("durationHours").toString()) : 0)
                .status(status)
                .organizationId(admin.getOrganizationId())
                .build();

        if (body.containsKey("teacherId") && body.get("teacherId") != null) {
            Long tid = Long.valueOf(body.get("teacherId").toString());
            teacherRepository.findById(tid).ifPresent(course::setTeacher);
        }
        course = courseRepository.save(course);

        // Auto-assign course to the selected batch
        if (assignedBatch != null) {
            if (assignedBatch.getCourses() == null) {
                assignedBatch.setCourses(new HashSet<>());
            }
            assignedBatch.getCourses().add(course);  // adds to batch_courses table
            // Remove this line: assignedBatch.setCourse(course);
            batchRepository.save(assignedBatch);
        }

        // Notify: assigned teacher + batch students + linked parents
        Admin senderAdmin = resolveSuperAdmin(admin);
        String adminName  = senderAdmin != null ? senderAdmin.getName()  : "Admin";
        String adminEmail = senderAdmin != null ? senderAdmin.getEmail() : null;
        List<String> courseWarn = notificationService.onCourseCreated(course, assignedBatch, "ADMIN", adminName, adminEmail);
        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("course", course.getId());
        resp.put("title",  course.getTitle());
        if (!courseWarn.isEmpty()) resp.put("emailWarnings", courseWarn);
        return ResponseEntity.ok(ApiResponse.ok("Course created", resp));
    }

    @Transactional
    @PutMapping("/courses/{id}")
    public ResponseEntity<ApiResponse<Course>> updateCourse(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
        if (body.containsKey("title"))        course.setTitle((String) body.get("title"));
        if (body.containsKey("description"))  course.setDescription((String) body.get("description"));
        if (body.containsKey("department"))   course.setDepartment((String) body.get("department"));
        if (body.containsKey("durationHours") && body.get("durationHours") != null)
            course.setDurationHours(Integer.valueOf(body.get("durationHours").toString()));
        // Assign or remove teacher
        if (body.containsKey("teacherId")) {
            Object tid = body.get("teacherId");
            if (tid == null || tid.toString().isBlank()) {
                course.setTeacher(null);
            } else {
                teacherRepository.findById(Long.valueOf(tid.toString()))
                        .ifPresent(course::setTeacher);
            }
        }
        courseRepository.save(course);
        return ResponseEntity.ok(ApiResponse.ok("Course updated", course));
    }

//    @Transactional
//    @DeleteMapping("/courses/{id}")
//    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
//        Course course = courseRepository.findById(id)
//                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
//        
//        // Delete all course materials
//        List<CourseMaterial> materials = courseMaterialRepository.findAll().stream()
//                .filter(m -> m.getCourse().getId().equals(id))
//                .toList();
//        if (!materials.isEmpty()) {
//            courseMaterialRepository.deleteAll(materials);
//        }
//        
//        // Delete all timetable slots for this course
//        List<TimetableSlot> slots = timetableSlotRepository.findByCourse(course);
//        if (!slots.isEmpty()) {
//            timetableSlotRepository.deleteAll(slots);
//        }
//        
//        // Delete all attendance records for this course
//        List<Attendance> attendances = attendanceRepository.findAll().stream()
//                .filter(a -> a.getCourse().getId().equals(id))
//                .toList();
//        if (!attendances.isEmpty()) {
//            attendanceRepository.deleteAll(attendances);
//        }
//        
//        // Delete all assignments for this course
//        List<Assignment> assignments = assignmentRepository.findAll().stream()
//                .filter(a -> a.getCourse().getId().equals(id))
//                .toList();
//        if (!assignments.isEmpty()) {
//            assignmentRepository.deleteAll(assignments);
//        }
//        
//        // Delete all exams for this course
//        List<Exam> exams = examRepository.findAll().stream()
//                .filter(e -> e.getCourse().getId().equals(id))
//                .toList();
//        if (!exams.isEmpty()) {
//            examRepository.deleteAll(exams);
//        }
//        
//        // Delete all forum posts for this course
//        List<ForumPost> posts = forumPostRepository.findByCourseOrderByCreatedAtDesc(course);
//        if (!posts.isEmpty()) {
//            forumPostRepository.deleteAll(posts);
//        }
//        
//        // Delete all fees for this course
//        List<Fee> fees = feeRepository.findAll().stream()
//                .filter(f -> f.getCourse() != null && f.getCourse().getId().equals(id))
//                .toList();
//        if (!fees.isEmpty()) {
//            feeRepository.deleteAll(fees);
//        }
//     // ✅ IMPORTANT: Remove all direct student enrollments from student_courses table
//        // This prevents foreign key constraint violations when deleting the course
//        List<Student> enrolledStudents = studentRepository.findAll().stream()
//                .filter(s -> s.getEnrolledCourses().stream()
//                        .anyMatch(c -> c.getId().equals(id)))
//                .toList();
//        for (Student student : enrolledStudents) {
//            student.getEnrolledCourses().removeIf(c -> c.getId().equals(id));
//            studentRepository.save(student);
//        }
//        
//        // Remove course from all batches (both many-to-many and legacy single course)
//        List<Batch> batches = batchRepository.findAll();
//        for (Batch batch : batches) {
//            // Remove from many-to-many relationship
//            batch.getCourses().removeIf(c -> c.getId().equals(id));
//            // Clear legacy single course if it matches
//            if (batch.getCourse() != null && batch.getCourse().getId().equals(id)) {
//                batch.setCourse(null);
//            }
//            batchRepository.save(batch);
//        }
//     
//        
//        // Finally delete the course
//        courseRepository.deleteById(id);
//        return ResponseEntity.ok(ApiResponse.ok("Course deleted", null));
//    }
    @Transactional
    @DeleteMapping("/courses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));

        // 1. Delete dependent child records first
        courseMaterialRepository.findAll().stream()
                .filter(m -> m.getCourse().getId().equals(id))
                .toList().forEach(courseMaterialRepository::delete);

        timetableSlotRepository.deleteAll(timetableSlotRepository.findByCourse(course));

        attendanceRepository.findAll().stream()
                .filter(a -> a.getCourse().getId().equals(id))
                .toList().forEach(attendanceRepository::delete);

        assignmentRepository.findAll().stream()
                .filter(a -> a.getCourse().getId().equals(id))
                .toList().forEach(assignmentRepository::delete);

        examRepository.findAll().stream()
                .filter(e -> e.getCourse().getId().equals(id))
                .toList().forEach(examRepository::delete);

        forumPostRepository.deleteAll(forumPostRepository.findByCourseOrderByCreatedAtDesc(course));

        feeRepository.findAll().stream()
                .filter(f -> f.getCourse() != null && f.getCourse().getId().equals(id))
                .toList().forEach(feeRepository::delete);

        // 2. ✅ NATIVE QUERY — directly wipes student_courses join table rows
        //    This bypasses Hibernate's lazy collection and flushes immediately
        courseRepository.removeAllStudentEnrollments(id);

        // 3. ✅ NATIVE QUERY — directly wipes batch_courses join table rows
        courseRepository.removeAllBatchCourseLinks(id);

        // 4. Clear legacy batch.course_id FK (single column, not join table)
        batchRepository.findAll().stream()
                .filter(b -> b.getCourse() != null && b.getCourse().getId().equals(id))
                .forEach(b -> {
                    b.setCourse(null);
                    batchRepository.save(b);
                });

        // 5. Now safe to delete — all references cleared
        courseRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Course deleted", null));
    }

    // ── Direct Course Enrollment (no batch needed) ────────────────────
    /** GET /api/admin/courses/{id}/students — students directly enrolled */
    @Transactional
    @GetMapping("/courses/{id}/students")
    public ResponseEntity<ApiResponse<List<Student>>> getCourseStudents(
            @PathVariable Long id) {
        courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
        // Use native query to bypass lazy loading issues
        List<Student> enrolled = studentRepository.findAll().stream()
                .filter(s -> s.getEnrolledCourses().stream()
                        .anyMatch(ec -> ec.getId().equals(id)))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(enrolled));
    }

    /** POST /api/admin/courses/{id}/students — enroll students directly (safe, no duplicate) */
    @Transactional
    @PostMapping("/courses/{id}/students")
    public ResponseEntity<ApiResponse<Map<String, Object>>> enrollStudentsInCourse(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));

        @SuppressWarnings("unchecked")
        List<Integer> studentIds = (List<Integer>) body.get("studentIds");
        int added = 0;
        for (Integer sid : studentIds) {
            Student s = studentRepository.findById(Long.valueOf(sid)).orElse(null);
            if (s == null) continue;
            // Reload enrolled courses fresh to avoid stale cache
            Student fresh = studentRepository.findById(s.getId()).orElse(s);
            // Only add if not already enrolled — prevents duplicate key error
            boolean alreadyEnrolled = fresh.getEnrolledCourses().stream()
                    .anyMatch(ec -> ec.getId().equals(course.getId()));
            if (!alreadyEnrolled) {
                fresh.getEnrolledCourses().add(course);
                studentRepository.save(fresh);
                added++;
            }
        }
        return ResponseEntity.ok(ApiResponse.ok("Students enrolled",
                Map.of("courseId", id, "added", added)));
    }

    /** DELETE /api/admin/courses/{id}/students/{studentId} — unenroll */
    @Transactional
    @DeleteMapping("/courses/{id}/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> unenrollStudentFromCourse(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        studentRepository.findById(studentId).ifPresent(s -> {
            s.getEnrolledCourses().removeIf(c -> c.getId().equals(id));
            studentRepository.save(s);
        });
        return ResponseEntity.ok(ApiResponse.ok("Student unenrolled", null));
    }

    // ── Batch Management ──────────────────────────────────────────────
    @Transactional
    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllBatches(@AuthenticationPrincipal Admin admin) {
        Long orgId = admin.getOrganizationId();
        List<Batch> batches = orgId != null ? batchRepository.findByOrganizationId(orgId) : batchRepository.findAll();
        List<Map<String, Object>> result = batches.stream().map(b -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id",         b.getId());
            m.put("name",       b.getName());
            m.put("department", b.getDepartment());
            m.put("startDate",  b.getStartDate() != null ? b.getStartDate().toString() : null);
            m.put("endDate",    b.getEndDate()   != null ? b.getEndDate().toString()   : null);
            m.put("status",     b.getStatus() != null ? b.getStatus().name() : "UPCOMING");
            m.put("createdAt",  b.getCreatedAt());

            // Students — include id + name so frontend can show count & unenrolled list
            java.util.Set<Student> studs = b.getStudents();
            List<Map<String, Object>> studentList = studs == null ? List.of() :
                studs.stream().map(s -> {
                    Map<String, Object> sm = new java.util.LinkedHashMap<>();
                    sm.put("id",         s.getId());
                    sm.put("name",       s.getName());
                    sm.put("userId",     s.getUserId());
                    sm.put("department", s.getDepartment());
                    return sm;
                }).collect(java.util.stream.Collectors.toList());
            m.put("students",     studentList);
            m.put("studentCount", studentList.size());

            // ALL courses in this batch (batch_courses many-to-many + legacy course_id)
            java.util.Set<Course> allCourses = new java.util.LinkedHashSet<>();
            if (b.getCourses() != null) allCourses.addAll(b.getCourses());
            if (b.getCourse()  != null) allCourses.add(b.getCourse());

            List<Map<String, Object>> courseList = allCourses.stream().map(c -> {
                Map<String, Object> cm = new java.util.LinkedHashMap<>();
                cm.put("id",           c.getId());
                cm.put("title",        c.getTitle());
                cm.put("department",   c.getDepartment());
                cm.put("durationHours",c.getDurationHours());
                cm.put("status",       c.getStatus() != null ? c.getStatus().name() : "DRAFT");
                if (c.getTeacher() != null) {
                    Map<String, Object> tm = new java.util.LinkedHashMap<>();
                    tm.put("id",   c.getTeacher().getId());
                    tm.put("name", c.getTeacher().getName());
                    cm.put("teacher", tm);
                }
                return cm;
            }).collect(java.util.stream.Collectors.toList());

            m.put("courses",     courseList);           // list of all subjects
            m.put("courseCount", courseList.size());
            // Keep legacy single course for old code
            m.put("course", courseList.isEmpty() ? null : courseList.get(0));
            return m;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/batches")
    public ResponseEntity<ApiResponse<Batch>> createBatch(
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, Object> body) {
        LocalDate startDate = LocalDate.parse((String) body.get("startDate"));
        LocalDate endDate   = LocalDate.parse((String) body.get("endDate"));
        LocalDate today     = LocalDate.now();

        // Auto-set status based on dates
        Batch.BatchStatus status;
        if (startDate.isAfter(today)) {
            status = Batch.BatchStatus.UPCOMING;
        } else if (endDate.isBefore(today)) {
            status = Batch.BatchStatus.COMPLETED;
        } else {
            status = Batch.BatchStatus.ACTIVE; // start <= today <= end
        }
        Batch batch = Batch.builder()
                .name((String) body.get("name"))
                .department((String) body.get("department"))
                .startDate(startDate)
                .endDate(endDate)
                .status(status)  // ← auto-calculated
                .organizationId(admin.getOrganizationId())
                .build();

        batchRepository.save(batch);
        return ResponseEntity.ok(ApiResponse.ok("Batch created", batch));
    }
    
    @PostMapping("/batches/sync-status")
    public ResponseEntity<ApiResponse<String>> syncBatchStatuses() {
        LocalDate today = LocalDate.now();
        List<Batch> batches = batchRepository.findAll();
        int active = 0, upcoming = 0, completed = 0;

        for (Batch batch : batches) {
            Batch.BatchStatus newStatus;
            if (batch.getStartDate().isAfter(today)) {
                newStatus = Batch.BatchStatus.UPCOMING;
                upcoming++;
            } else if (batch.getEndDate().isBefore(today)) {
                newStatus = Batch.BatchStatus.COMPLETED;
                completed++;
            } else {
                newStatus = Batch.BatchStatus.ACTIVE;
                active++;
            }
            batch.setStatus(newStatus);
            batchRepository.save(batch);
        }

        return ResponseEntity.ok(ApiResponse.ok(
            String.format("Synced %d batches — Active:%d Upcoming:%d Completed:%d",
                batches.size(), active, upcoming, completed),
            "done"
        ));
    }

    /**
     * POST /api/admin/batches/cleanup-dept
     * Scans every batch and removes any student whose department
     * does not match the batch department.
     * Returns a summary of who was removed from which batch.
     */
    @Transactional
    @PostMapping("/batches/cleanup-dept")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cleanupCrossDeptStudents() {
        List<Batch> batches = batchRepository.findAll();
        int totalRemoved = 0;
        List<Map<String, Object>> details = new java.util.ArrayList<>();

        for (Batch batch : batches) {
            if (batch.getDepartment() == null) continue;

            List<Student> toRemove = batch.getStudents().stream()
                    .filter(s -> s.getDepartment() == null
                            || !batch.getDepartment().equalsIgnoreCase(s.getDepartment()))
                    .collect(java.util.stream.Collectors.toList());

            if (!toRemove.isEmpty()) {
                toRemove.forEach(s -> batch.getStudents().remove(s));
                batchRepository.save(batch);

                Map<String, Object> entry = new java.util.LinkedHashMap<>();
                entry.put("batchId",   batch.getId());
                entry.put("batchName", batch.getName());
                entry.put("batchDept", batch.getDepartment());
                entry.put("removed",   toRemove.stream()
                        .map(s -> s.getName() + " (" + s.getDepartment() + ")")
                        .collect(java.util.stream.Collectors.toList()));
                details.add(entry);
                totalRemoved += toRemove.size();
            }
        }

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("totalRemoved", totalRemoved);
        result.put("batches",      details);

        String msg = totalRemoved == 0
                ? "All batches are clean — no cross-department students found."
                : totalRemoved + " cross-department student(s) removed from " + details.size() + " batch(es).";

        return ResponseEntity.ok(ApiResponse.ok(msg, result));
    }

    @DeleteMapping("/batches/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable Long id) {
        batchRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Batch deleted", null));
    }

    /** POST /api/admin/batches/{id}/students — add students to batch (with overlap check) */
    @Transactional
    @PostMapping("/batches/{id}/students")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addStudentsToBatch(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));

        @SuppressWarnings("unchecked")
        List<Integer> studentIds = (List<Integer>) body.get("studentIds");

        int added   = 0;
        int skipped = 0;
        List<String> conflicts = new java.util.ArrayList<>();

        for (Integer sid : studentIds) {
            Long studentId = Long.valueOf(sid);
            Student s = studentRepository.findById(studentId).orElse(null);
            if (s == null) { skipped++; continue; }

            // Check if student is already in THIS batch
            if (batch.getStudents().stream().anyMatch(existing -> existing.getId().equals(studentId))) {
                skipped++;
                conflicts.add(s.getName() + " (already in this batch)");
                continue;
            }

            // ── DEPARTMENT CHECK ─────────────────────────────────────────────
            // Student's department must match the batch department
            if (batch.getDepartment() != null && !batch.getDepartment().equalsIgnoreCase(s.getDepartment())) {
                skipped++;
                conflicts.add(s.getName() + " (department mismatch: student is " + s.getDepartment() + ", batch is " + batch.getDepartment() + ")");
                continue;
            }

            // ── EXCLUSIVITY CHECK ────────────────────────────────────────────
            // A student cannot be in two batches whose date ranges overlap
            // (Relaxed for multi-batch concurrent enrollments)
            /*
            boolean hasOverlap = batchRepository.studentHasOverlappingBatch(
                    studentId, batch.getStartDate(), batch.getEndDate());
            if (hasOverlap) {
                skipped++;
                conflicts.add(s.getName() + " (already in an overlapping batch)");
                continue;
            }
            */

            batch.getStudents().add(s);
            added++;
        }

        batchRepository.save(batch);

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("batchId",      id);
        resp.put("added",        added);
        resp.put("skipped",      skipped);
        resp.put("total",        batch.getStudents().size());
        if (!conflicts.isEmpty()) resp.put("conflicts", conflicts);

        String msg = added > 0
                ? added + " student(s) added to batch"
                : "No students added";
        if (skipped > 0) msg += " (" + skipped + " skipped — already in overlapping batch)";

        return ResponseEntity.ok(ApiResponse.ok(msg, resp));
    }

    /** DELETE /api/admin/batches/{id}/students/{studentId} — remove student from batch */
    @Transactional
    @DeleteMapping("/batches/{id}/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeStudentFromBatch(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));
        batch.getStudents().removeIf(s -> s.getId().equals(studentId));
        batchRepository.save(batch);
        return ResponseEntity.ok(ApiResponse.ok("Student removed from batch", null));
    }

    /** GET /api/admin/batches/{id}/students — list students in a batch */
    @Transactional
    @GetMapping("/batches/{id}/students")
    public ResponseEntity<ApiResponse<java.util.Set<Student>>> getBatchStudents(
            @PathVariable Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));
        return ResponseEntity.ok(ApiResponse.ok(batch.getStudents()));
    }

    /** GET /api/admin/batches/{id}/courses — list all courses/subjects in a batch */
    @Transactional
    @GetMapping("/batches/{id}/courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBatchCourses(
            @PathVariable Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));

        // Combine batch_courses (new) + legacy course_id
        java.util.Set<Course> all = new java.util.LinkedHashSet<>();
        if (batch.getCourses() != null) all.addAll(batch.getCourses());
        if (batch.getCourse()  != null) all.add(batch.getCourse());

        List<Map<String, Object>> result = all.stream().map(c -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id",           c.getId());
            m.put("title",        c.getTitle());
            m.put("description",  c.getDescription());
            m.put("department",   c.getDepartment());
            m.put("durationHours",c.getDurationHours());
            m.put("status",       c.getStatus() != null ? c.getStatus().name() : "DRAFT");
            if (c.getTeacher() != null) {
                m.put("teacherName", c.getTeacher().getName());
                m.put("teacherId",   c.getTeacher().getId());
            }
            return m;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** POST /api/admin/batches/{id}/courses — add a course/subject to a batch */
    @Transactional
    @PostMapping("/batches/{id}/courses")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addCourseToBatch(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));

        Long courseId = Long.valueOf(body.get("courseId").toString());
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (batch.getCourses() == null) batch.setCourses(new java.util.HashSet<>());
        batch.getCourses().add(course);
        batchRepository.save(batch);

        return ResponseEntity.ok(ApiResponse.ok("Course added to batch",
                Map.of("batchId", id, "courseId", courseId, "courseTitle", course.getTitle())));
    }

    /** DELETE /api/admin/batches/{id}/courses/{courseId} — remove a course from a batch */
    @Transactional
    @DeleteMapping("/batches/{id}/courses/{courseId}")
    public ResponseEntity<ApiResponse<Void>> removeCoursFromBatch(
            @PathVariable Long id,
            @PathVariable Long courseId) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));
        if (batch.getCourses() != null)
            batch.getCourses().removeIf(c -> c.getId().equals(courseId));
        batchRepository.save(batch);
        return ResponseEntity.ok(ApiResponse.ok("Course removed from batch", null));
    }

    /** PATCH /api/admin/batches/{id}/course — legacy: keep for backward compat */
    @Transactional
    @PatchMapping("/batches/{id}/course")
    public ResponseEntity<ApiResponse<Batch>> assignCourseToBatch(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));
        if (body.containsKey("courseId") && body.get("courseId") != null) {
            Long courseId = Long.valueOf(body.get("courseId").toString());
            courseRepository.findById(courseId).ifPresent(batch::setCourse);
        } else {
            batch.setCourse(null);
        }
        batchRepository.save(batch);
        return ResponseEntity.ok(ApiResponse.ok("Course assigned to batch", batch));
    }

    // ── Fee Management ────────────────────────────────────────────────
    @Transactional
    @GetMapping("/fees")
    public ResponseEntity<ApiResponse<List<Fee>>> getAllFees(
            @AuthenticationPrincipal Admin admin,
            @RequestParam(required = false) Fee.FeeStatus status) {
        Long orgId = admin.getOrganizationId();
        List<Fee> fees;
        if (orgId != null) {
            fees = status != null
                    ? feeRepository.findByStudentOrganizationIdAndStatus(orgId, status)
                    : feeRepository.findByStudentOrganizationId(orgId);
        } else {
            fees = status != null ? feeRepository.findByStatus(status) : feeRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.ok(fees));
    }

    @PostMapping("/fees")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createFee(
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, Object> body) {
    	Long studentId = Safe.toLong(body.get("studentId"));
    	if (studentId == null) {
    	    throw new IllegalArgumentException("studentId is required");
    	}
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        Fee.FeeBuilder feeBuilder = Fee.builder()
                .student(student)
                .amount(new BigDecimal(body.get("amount").toString()))
                .dueDate(LocalDate.parse((String) body.get("dueDate")))
                .description((String) body.getOrDefault("description", ""))
                .status(Fee.FeeStatus.PENDING);

        if (body.containsKey("feeType") && body.get("feeType") != null) {
            try { feeBuilder.feeType(Fee.FeeType.valueOf((String) body.get("feeType"))); }
            catch (IllegalArgumentException ignored) {}
        }
        if (body.containsKey("department") && body.get("department") != null)
            feeBuilder.department((String) body.get("department"));

        if (body.containsKey("batchId") && body.get("batchId") != null) {
            Long batchId = Long.valueOf(body.get("batchId").toString());
            batchRepository.findById(batchId).ifPresent(feeBuilder::batch);
        }
        if (body.containsKey("courseId") && body.get("courseId") != null) {
            Long courseId = Long.valueOf(body.get("courseId").toString());
            courseRepository.findById(courseId).ifPresent(feeBuilder::course);
        }

        Fee fee = feeBuilder.build();
        feeRepository.save(fee);
        // Pass admin name+email so email From shows who added the fee
        Admin senderAdmin = resolveSuperAdmin(admin);
        String adminName  = senderAdmin != null ? senderAdmin.getName()  : null;
        String adminEmail = senderAdmin != null ? senderAdmin.getEmail() : null;
        List<String> feeWarn = notificationService.onFeeAdded(fee, adminName, adminEmail);
        Map<String, Object> feeResp = new java.util.LinkedHashMap<>();
        feeResp.put("fee", fee);
        if (!feeWarn.isEmpty()) feeResp.put("emailWarnings", feeWarn);
        return ResponseEntity.ok(ApiResponse.ok("Fee created", feeResp));
    }

    /**
     * POST /api/admin/batches/{id}/fees
     * Generate batch fee for ALL students in this batch automatically.
     * Body: { amount, dueDate, description, feeType }
     */
    @Transactional
    @PostMapping("/batches/{id}/fees")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateBatchFee(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, Object> body) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));

        if (batch.getStudents() == null || batch.getStudents().isEmpty()) {
            throw new ResourceNotFoundException("No students in this batch");
        }

        Fee.FeeType feeType = Fee.FeeType.TUITION;
        try {
            if (body.containsKey("feeType") && body.get("feeType") != null)
                feeType = Fee.FeeType.valueOf((String) body.get("feeType"));
        } catch (IllegalArgumentException ignored) {}

        String description = (String) body.getOrDefault("description", batch.getName() + " Fee");
        LocalDate dueDate  = LocalDate.parse((String) body.get("dueDate"));
        BigDecimal amount  = new BigDecimal(body.get("amount").toString());
        Course course = batch.getCourse();

        Admin senderAdmin = resolveSuperAdmin(admin);
        String adminName  = senderAdmin != null ? senderAdmin.getName()  : null;
        String adminEmail = senderAdmin != null ? senderAdmin.getEmail() : null;

        int created = 0;
        for (Student student : batch.getStudents()) {
            Fee fee = Fee.builder()
                    .student(student)
                    .batch(batch)
                    .course(course)
                    .department(batch.getDepartment())
                    .amount(amount)
                    .dueDate(dueDate)
                    .description(description)
                    .feeType(feeType)
                    .status(Fee.FeeStatus.PENDING)
                    .build();
            feeRepository.save(fee);
            // Notify student + linked parents (in-app + email) — from the admin who created
            List<String> batchFeeWarn = notificationService.onFeeAdded(fee, adminName, adminEmail);
            batchFeeWarn.forEach(w -> log.warn("Batch fee email warning: {}", w));
            created++;
        }

        return ResponseEntity.ok(ApiResponse.ok("Batch fee generated",
                Map.of("batchId", id, "studentsCharged", created, "amount", amount)));
    }

    @PatchMapping("/fees/{id}/mark-paid")
    public ResponseEntity<ApiResponse<Fee>> markFeePaid(@PathVariable Long id) {
        Fee fee = feeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee not found: " + id));
        fee.setStatus(Fee.FeeStatus.PAID);
        fee.setPaidDate(LocalDate.now());
        fee.setPaidAmount(fee.getAmount());
        feeRepository.save(fee);
        return ResponseEntity.ok(ApiResponse.ok("Fee marked as paid", fee));
    }

    // ── Announcements ─────────────────────────────────────────────────
    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> getAllAnnouncements() {
        return ResponseEntity.ok(ApiResponse.ok(announcementRepository.findAll()));
    }

    @PostMapping("/announcements")
    public ResponseEntity<ApiResponse<Announcement>> createAnnouncement(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Admin admin) {
        Role target = body.containsKey("targetRole") && body.get("targetRole") != null
                ? Role.valueOf((String) body.get("targetRole"))
                : null;
        Announcement ann = Announcement.builder()
                .title((String) body.get("title"))
                .content((String) body.get("content"))
                .authorName(admin.getName())
                .targetRole(target)
                .build();
        announcementRepository.save(ann);
        return ResponseEntity.ok(ApiResponse.ok("Announcement created", ann));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable Long id) {
        announcementRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Announcement deleted", null));
    }
    // ── Contact Form Queries ──────────────────────────────────────────
    @GetMapping("/contact-messages")
    public ResponseEntity<ApiResponse<List<ContactMsg>>> getContactMessages(
            @AuthenticationPrincipal Admin admin,
            @RequestParam(required = false) ContactMsg.MessageStatus status) {
        Long orgId = admin.getOrganizationId();
        List<ContactMsg> msgs;
        if (orgId != null) {
            msgs = status != null
                    ? contactMessageRepository.findByOrganizationIdAndStatus(orgId, status)
                    : contactMessageRepository.findByOrganizationIdOrderByReceivedAtDesc(orgId);
        } else {
            msgs = status != null
                    ? contactMessageRepository.findByStatus(status)
                    : contactMessageRepository.findAllByOrderByReceivedAtDesc();
        }
        return ResponseEntity.ok(ApiResponse.ok(msgs));
    }

    @PatchMapping("/contact-messages/{id}/status")
    public ResponseEntity<ApiResponse<ContactMsg>> updateContactStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        ContactMsg msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + id));
        try {
            msg.setStatus(ContactMsg.MessageStatus.valueOf(body.get("status")));
        } catch (Exception ignored) {}
        contactMessageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.ok("Status updated", msg));
    }

    @DeleteMapping("/contact-messages/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContactMessage(@PathVariable Long id) {
        contactMessageRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Deleted", null));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getAdminNotifications(
            @AuthenticationPrincipal Admin admin) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(admin.getEmail())));
    }

    @Transactional
    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAdminNotifRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin admin) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipientEmail().equals(admin.getEmail())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }

    @Transactional
    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAdminNotifsRead(
            @AuthenticationPrincipal Admin admin) {
        notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(admin.getEmail())
                .forEach(n -> { n.setRead(true); notificationRepository.save(n); });
        return ResponseEntity.ok(ApiResponse.ok("All read", null));
    }

    // ── Student Enrollment Request Management ────────────────────────
    @GetMapping("/enrollment-requests")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEnrollmentRequests(
            @AuthenticationPrincipal Admin admin) {
        Long orgId = admin.getOrganizationId();
        List<CourseEnrollmentRequest> reqs = orgId != null 
                ? courseEnrollmentRequestRepository.findByOrganizationIdAndStatus(orgId, CourseEnrollmentRequest.EnrollmentRequestStatus.PENDING)
                : courseEnrollmentRequestRepository.findAll().stream()
                        .filter(r -> r.getStatus() == CourseEnrollmentRequest.EnrollmentRequestStatus.PENDING)
                        .collect(java.util.stream.Collectors.toList());

        List<Map<String, Object>> result = reqs.stream().map(r -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("status", r.getStatus().name());
            m.put("createdAt", r.getCreatedAt().toString());
            
            Map<String, Object> sMap = new java.util.LinkedHashMap<>();
            sMap.put("id", r.getStudent().getId());
            sMap.put("name", r.getStudent().getName());
            sMap.put("email", r.getStudent().getEmail());
            m.put("student", sMap);

            Map<String, Object> cMap = new java.util.LinkedHashMap<>();
            cMap.put("id", r.getCourse().getId());
            cMap.put("title", r.getCourse().getTitle());
            m.put("course", cMap);

            return m;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/enrollment-requests/{id}/approve")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> approveEnrollmentRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin admin) {
        CourseEnrollmentRequest request = courseEnrollmentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (admin.getOrganizationId() != null && !admin.getOrganizationId().equals(request.getOrganizationId())) {
            return ResponseEntity.status(403).build();
        }

        request.setStatus(CourseEnrollmentRequest.EnrollmentRequestStatus.APPROVED);
        courseEnrollmentRequestRepository.save(request);

        // Auto enroll student
        Long studentId = request.getStudent().getId();
        Long courseId = request.getCourse().getId();
        
        Long count = courseRepository.existsStudentEnrollment(studentId, courseId);
        if (count == null || count == 0) {
            courseRepository.enrollStudent(studentId, courseId);
        }

        // Notify student
        notificationRepository.save(Notification.builder()
                .recipientEmail(request.getStudent().getEmail())
                .title("Enrollment Request Approved! 🎉")
                .message("Your request to enroll in " + request.getCourse().getTitle() + " has been approved. You can now access your learning dashboard.")
                .type(Notification.NotificationType.SUCCESS)
                .read(false)
                .build());

        return ResponseEntity.ok(ApiResponse.ok("Request approved and student enrolled", null));
    }

    @PostMapping("/enrollment-requests/{id}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> rejectEnrollmentRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin admin) {
        CourseEnrollmentRequest request = courseEnrollmentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (admin.getOrganizationId() != null && !admin.getOrganizationId().equals(request.getOrganizationId())) {
            return ResponseEntity.status(403).build();
        }

        request.setStatus(CourseEnrollmentRequest.EnrollmentRequestStatus.REJECTED);
        courseEnrollmentRequestRepository.save(request);

        // Notify student
        notificationRepository.save(Notification.builder()
                .recipientEmail(request.getStudent().getEmail())
                .title("Enrollment Request Rejected ❌")
                .message("Your request to enroll in " + request.getCourse().getTitle() + " was rejected by the admin.")
                .type(Notification.NotificationType.ERROR)
                .read(false)
                .build());

        return ResponseEntity.ok(ApiResponse.ok("Request rejected", null));
    }

    // ── Teacher Performance Overview for Admin ───────────────────────
    @GetMapping("/teachers/performance")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTeachersPerformance(
            @AuthenticationPrincipal Admin admin) {
        Long orgId = admin.getOrganizationId();
        List<Teacher> teachers = orgId != null 
                ? teacherRepository.findByOrganizationId(orgId) 
                : teacherRepository.findAll();

        List<Map<String, Object>> list = new java.util.ArrayList<>();
        for (Teacher t : teachers) {
            Double avgRating = teacherReviewRepository.getAverageRatingForTeacher(t.getId());
            Long totalReviews = teacherReviewRepository.countReviewsForTeacher(t.getId());

            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("teacherId", t.getId());
            m.put("teacherName", t.getName());
            m.put("teacherEmail", t.getEmail());
            m.put("department", t.getDepartment());
            m.put("averageRating", avgRating != null ? avgRating : 0.0);
            m.put("totalReviews", totalReviews != null ? totalReviews : 0L);
            list.add(m);
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/teachers/{teacherId}/reviews")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTeacherReviewsAdmin(
            @PathVariable Long teacherId,
            @AuthenticationPrincipal Admin admin) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));

        if (admin.getOrganizationId() != null && !admin.getOrganizationId().equals(teacher.getOrganizationId())) {
            return ResponseEntity.status(403).build();
        }

        List<TeacherReview> reviews = teacherReviewRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
        List<Map<String, Object>> reviewsList = reviews.stream()
                .map(r -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", r.getId());
                    m.put("rating", r.getRating());
                    m.put("reviewText", r.getReviewText());
                    m.put("createdAt", r.getCreatedAt().toString());
                    m.put("studentName", r.getStudent() != null ? r.getStudent().getName() : "Anonymous");
                    return m;
                })
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(reviewsList));
    }

    // ── Generic Admin Certificates ────────────────────────────────────────────────
    @Transactional
    @PostMapping("/certificates/issue")
    public ResponseEntity<ApiResponse<AdminCertificate>> issueGenericCertificate(
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, Object> body) {
        
        String title = (String) body.get("title");
        String recipientType = (String) body.get("recipientType");
        Long recipientId = Long.valueOf(body.get("recipientId").toString());
        String bodyContent = (String) body.get("bodyContent");
        String issuedBy = (String) body.get("issuedBy");
        String issueDateStr = (String) body.get("date");
        
        String recipientEmail = null;
        String recipientName = null;

        if ("STUDENT".equalsIgnoreCase(recipientType)) {
            Student s = studentRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
            recipientEmail = s.getEmail();
            recipientName = s.getName();
        } else if ("TEACHER".equalsIgnoreCase(recipientType)) {
            Teacher t = teacherRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
            recipientEmail = t.getEmail();
            recipientName = t.getName();
        } else {
            throw new IllegalArgumentException("Invalid recipientType: " + recipientType);
        }

        AdminCertificate cert = AdminCertificate.builder()
            .title(title)
            .recipientType(recipientType.toUpperCase())
            .recipientId(recipientId)
            .recipientName(recipientName)
            .bodyContent(bodyContent)
            .issuedBy(issuedBy)
            .issueDate(issueDateStr != null ? LocalDate.parse(issueDateStr) : LocalDate.now())
            .organizationId(admin.getOrganizationId())
            .build();

        adminCertificateRepository.save(cert);

        if (recipientEmail != null) {
            // Pass admin name+email so email From shows who issued the certificate
            Admin senderAdmin = resolveSuperAdmin(admin);
            String adminName  = senderAdmin != null ? senderAdmin.getName()  : "Admin";
            String adminEmail = senderAdmin != null ? senderAdmin.getEmail() : null;
            notificationService.onAdminCertificateIssued(cert, recipientEmail,
                    adminName, adminEmail);
        }

        return ResponseEntity.ok(ApiResponse.ok("Certificate Issued successfully", cert));
    }

    private Admin resolveSuperAdmin(Admin admin) {
        if (admin == null) return null;
        if (admin.isSuperAdmin()) return admin;
        if (admin.getOrganizationId() != null) {
            List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(admin.getOrganizationId());
            if (!superAdmins.isEmpty()) {
                return superAdmins.get(0);
            }
        }
        return admin;
    }

    // ── Organization Subscription Endpoints (Super Admin Only) ──────────────────

    @GetMapping("/subscription/active")
    public ResponseEntity<ApiResponse<OrganizationSubscription>> getActiveSubscription(
            @AuthenticationPrincipal Admin admin) {
        if (!admin.isSuperAdmin()) {
            throw new BadRequestException("Access Denied: Only organization Super Admins can view subscription details.");
        }
        if (admin.getOrganizationId() == null) {
            throw new BadRequestException("This admin is not associated with an organization.");
        }
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getActiveSubscription(admin.getOrganizationId())));
    }

    @GetMapping("/subscription/packages")
    public ResponseEntity<ApiResponse<List<SubscriptionPackage>>> getActivePackages(
            @AuthenticationPrincipal Admin admin) {
        if (!admin.isSuperAdmin()) {
            throw new BadRequestException("Access Denied: Only organization Super Admins can view subscription packages.");
        }
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getActivePackages()));
    }

    @PostMapping("/subscription/subscribe")
    public ResponseEntity<ApiResponse<OrganizationSubscription>> subscribe(
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, Long> payload) {
        if (!admin.isSuperAdmin()) {
            throw new BadRequestException("Access Denied: Only organization Super Admins can purchase subscription plans.");
        }
        if (admin.getOrganizationId() == null) {
            throw new BadRequestException("This admin is not associated with an organization.");
        }
        Long packageId = payload.get("packageId");
        if (packageId == null) {
            throw new BadRequestException("packageId is required.");
        }
        return ResponseEntity.ok(ApiResponse.ok("Subscribed successfully", subscriptionService.subscribeOrganization(admin.getOrganizationId(), packageId)));
    }
}