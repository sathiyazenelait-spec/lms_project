package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.*;
import com.zenelait.lms.service.notification.NotificationService;
import com.zenelait.lms.service.mail.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/timetable")
@RequiredArgsConstructor
@Slf4j
public class TimetableController {

    private final TimetableSlotRepository  timetableRepo;
    private final ParentRepository         parentRepository;
    private final StudentRepository        studentRepository;
    private final BatchRepository          batchRepository;
    private final CourseRepository         courseRepository;
    private final TeacherRepository        teacherRepository;
    private final NotificationRepository   notificationRepository;
    private final ParentChildRepository    parentChildRepository;
    private final NotificationService      notificationService;
    private final EmailService             emailService;
    private final AdminRepository          adminRepository;

    // ── GET: all active-batch timetable slots ───────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveTimetable(
            @AuthenticationPrincipal Admin admin) {
        Long orgId = admin.getOrganizationId();
        List<TimetableSlot> slots = orgId != null
                ? timetableRepo.findAllActiveBatchSlotsByOrgId(orgId)
                : timetableRepo.findAllActiveBatchSlots();
        return ResponseEntity.ok(ApiResponse.ok(slots.stream().map(this::toMap).collect(Collectors.toList())));
    }

    // ── GET: slots for a specific batch ───────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBatchTimetable(
            @PathVariable Long batchId) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + batchId));
        List<TimetableSlot> slots = timetableRepo.findByBatch(batch);
        return ResponseEntity.ok(ApiResponse.ok(slots.stream().map(this::toMap).collect(Collectors.toList())));
    }

    // ── GET: active batches (for the “Add Slot” dropdown) ─────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/active-batches")
    @Transactional
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveBatches(
            @AuthenticationPrincipal Admin admin) {
        LocalDate today = LocalDate.now();
        Long orgId = admin.getOrganizationId();
        // Filter to only batches belonging to this org
        List<com.zenelait.lms.entity.Batch> batchSource = orgId != null
                ? batchRepository.findByOrganizationId(orgId)
                : batchRepository.findAll();
        List<Map<String, Object>> result = batchSource.stream()
                .filter(b -> {
                    if (b.getStartDate() == null || b.getEndDate() == null) return false;
                    return !b.getStartDate().isAfter(today.plusDays(2))
                            && !b.getEndDate().isBefore(today);
                })
                .map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",         b.getId());
                    m.put("name",       b.getName());
                    m.put("department", b.getDepartment());
                    m.put("startDate",  b.getStartDate().toString());
                    m.put("endDate",    b.getEndDate().toString());
                    m.put("status",     b.getStatus() != null ? b.getStatus().name() : "ACTIVE");
                    m.put("studentCount", b.getStudents() != null ? b.getStudents().size() : 0);

                    // ALL courses/subjects in this batch (many-to-many + legacy)
                    java.util.Set<Course> all = new java.util.LinkedHashSet<>();
                    if (b.getCourses() != null) all.addAll(b.getCourses());
                    if (b.getCourse()  != null) all.add(b.getCourse());

                    List<Map<String, Object>> courseList = all.stream().map(c -> {
                        Map<String, Object> cm = new LinkedHashMap<>();
                        cm.put("id",    c.getId());
                        cm.put("title", c.getTitle());
                        if (c.getTeacher() != null) {
                            cm.put("teacherId",   c.getTeacher().getId());
                            cm.put("teacherName", c.getTeacher().getName());
                        }
                        return cm;
                    }).collect(Collectors.toList());

                    m.put("courses", courseList);
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    // ── POST: create a new slot ────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSlot(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Admin admin) {

        Long batchId  = Long.valueOf(body.get("batchId").toString());
        Long courseId = Long.valueOf(body.get("courseId").toString());
        String day    = body.get("dayOfWeek").toString().toUpperCase();

        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + batchId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        // ── Rule 1: batch must be active (started ≤ today+2, not yet ended) ──
        LocalDate today = LocalDate.now();
        if (batch.getStartDate() == null || batch.getStartDate().isAfter(today.plusDays(2))) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Cannot add timetable: batch '" + batch.getName() + "' has not started yet."));
        }
        if (batch.getEndDate() != null && batch.getEndDate().isBefore(today)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Cannot add timetable: batch '" + batch.getName() + "' has already ended."));
        }

        // ── Rule 2: same course cannot appear twice on the same day in this batch ──
        boolean duplicate = timetableRepo.courseExistsOnDayForBatch(batchId, courseId, day, -1L);
        if (duplicate) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "'" + course.getTitle() + "' is already scheduled on " + day +
                    " for batch '" + batch.getName() + "'. A course cannot appear twice on the same day."));
        }

        LocalTime startTime = LocalTime.parse(body.get("startTime").toString());
        LocalTime endTime   = LocalTime.parse(body.get("endTime").toString());
        if (!startTime.isBefore(endTime)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Start time must be before end time."));
        }
        Long lastSlotId = findLastSlotId(batchId, day);
        LocalTime lastEndTime = timetableRepo.findLastEndTime(batchId, day);

        // ✅ Enforce continuity ONLY if slots exist
        if (lastSlotId != null && lastEndTime != null) {
            if (!startTime.equals(lastEndTime)) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "Slots must be continuous. Next slot should start at " + lastEndTime));
            }
        }
        // if null → first slot → allowed

        // ✅ Rule 4: prevent overlap
        boolean overlap = timetableRepo.existsTimeOverlap(batchId, day, startTime, endTime);
        if (overlap) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Time overlaps with existing slot."));
        }

        TimetableSlot slot = TimetableSlot.builder()
                .batch(batch)
                .course(course)
                .dayOfWeek(day)
                .startTime(startTime)
                .endTime(endTime)
                .room(body.containsKey("room") ? body.get("room").toString() : null)
                .build();

        // Assign teacher from course if not explicitly specified
        if (body.containsKey("teacherId") && body.get("teacherId") != null) {
            teacherRepository.findById(Long.valueOf(body.get("teacherId").toString()))
                    .ifPresent(slot::setTeacher);
        } else if (course.getTeacher() != null) {
            slot.setTeacher(course.getTeacher());
        }

        timetableRepo.save(slot);

        // ── Notify students + parents + teacher ───────────────────────────────
        List<String> emailWarnings = sendTimetableNotifications(slot, batch, admin);

        Map<String, Object> resp = toMap(slot);
        if (!emailWarnings.isEmpty()) resp.put("emailWarnings", emailWarnings);
        return ResponseEntity.ok(ApiResponse.ok("Timetable slot created", resp));
    }
    public  Long findLastSlotId(Long batchId, String day) {
        List<Long> ids = timetableRepo.findLastSlotIds(batchId, day);
        return ids.isEmpty() ? null : ids.get(0);
    }

    // ── PUT: update an existing slot ──────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSlot(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Admin admin) {

        TimetableSlot slot = timetableRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable slot not found: " + id));

        String day = body.containsKey("dayOfWeek")
                ? body.get("dayOfWeek").toString().toUpperCase() : slot.getDayOfWeek();

        // ── Rule: same course can't be on same day twice in this batch (exclude self) ──
        Long batchId  = slot.getBatch() != null ? slot.getBatch().getId() : -1L;
        Long courseId = slot.getCourse() != null ? slot.getCourse().getId() : -1L;
        
        Long lastSlotId = findLastSlotId(batchId, day);

        if (lastSlotId != null && !slot.getId().equals(lastSlotId)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Only last slot can be modified."));
        }

        LocalTime newStart = body.containsKey("startTime")
                ? LocalTime.parse(body.get("startTime").toString())
                : slot.getStartTime();

        LocalTime newEnd = body.containsKey("endTime")
                ? LocalTime.parse(body.get("endTime").toString())
                : slot.getEndTime();
     // ✅ Validate time order
        if (!newStart.isBefore(newEnd)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Start time must be before end time."));
        }

        // ✅ overlap check
        boolean overlap = timetableRepo.existsTimeOverlapExcludingId(
                batchId, day, newStart, newEnd, id);
        if (overlap) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Updated time overlaps."));
        }
        boolean duplicate = timetableRepo.courseExistsOnDayForBatch(batchId, courseId, day, id);
        if (duplicate) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "'" + slot.getCourse().getTitle() + "' is already scheduled on " + day +
                    " for this batch. A course cannot appear twice on the same day."));
        }

        if (body.containsKey("dayOfWeek"))  slot.setDayOfWeek(day);
        if (body.containsKey("startTime"))  slot.setStartTime(LocalTime.parse(body.get("startTime").toString()));
        if (body.containsKey("endTime"))    slot.setEndTime(LocalTime.parse(body.get("endTime").toString()));
        if (body.containsKey("room"))       slot.setRoom(body.get("room") != null ? body.get("room").toString() : null);

        // Allow reassigning teacher
        if (body.containsKey("teacherId") && body.get("teacherId") != null) {
            teacherRepository.findById(Long.valueOf(body.get("teacherId").toString()))
                    .ifPresent(slot::setTeacher);
        }

        timetableRepo.save(slot);
        return ResponseEntity.ok(ApiResponse.ok("Timetable slot updated", toMap(slot)));
    }
    
    

    // ── DELETE: remove a slot ──────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(@PathVariable Long id) {
        timetableRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Slot deleted", null));
    }

    // ── STUDENT endpoint: GET /api/admin/timetable/student (accessible by student)
    // @GetMapping("/student")
    // @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    // public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudentTimetable(
    //         @AuthenticationPrincipal Student student) {
    //     // Find batches the student is enrolled in → their timetable slots
    //     List<Map<String, Object>> result = batchRepository.findAll().stream()
    //             .filter(b -> b.getStudents().stream().anyMatch(s -> s.getId().equals(student.getId())))
    //             .filter(b -> b.getEndDate() == null || !b.getEndDate().isBefore(LocalDate.now()))
    //             .flatMap(b -> timetableRepo.findByBatch(b).stream())
    //             .map(this::toMap)
    //             .collect(Collectors.toList());
    //     return ResponseEntity.ok(ApiResponse.ok(result));
    // }
    @Transactional
    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudentTimetable() {
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        
        Object principal = auth.getPrincipal();
        String email = null;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        }
        
        if (email == null) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }

        java.util.Optional<Student> studentOpt = studentRepository.findByEmail(email);
        if (studentOpt.isEmpty()) {
            System.out.println("[DEBUG-TIMETABLE] Student not found for email: " + email);
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }
        Student student = studentOpt.get();
        System.out.println("[DEBUG-TIMETABLE] Fetching timetable for student ID: " + student.getId() + ", Email: " + student.getEmail());

        // 1. Slots via Batches
        List<TimetableSlot> batchSlots = batchRepository.findAll().stream()
                .filter(b -> b.getStudents().stream().anyMatch(s -> s.getId().equals(student.getId())))
                .flatMap(b -> timetableRepo.findByBatch(b).stream())
                .toList();
        System.out.println("[DEBUG-TIMETABLE] Found batch slots count: " + batchSlots.size());

        // 2. Slots via Direct Course Enrollments
        List<Course> directCourses = courseRepository.findDirectlyEnrolledByStudentId(student.getId());
        List<TimetableSlot> directCourseSlots = timetableRepo.findAll().stream()
                .filter(slot -> slot.getBatch() == null && directCourses.contains(slot.getCourse()))
                .toList();

        // Combine
        List<TimetableSlot> combined = new ArrayList<>();
        combined.addAll(batchSlots);
        combined.addAll(directCourseSlots);

        List<Map<String, Object>> result = combined.stream()
                .map(this::toMap)
                .distinct()
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── TEACHER endpoint
    @Transactional
    @GetMapping("/teacher")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTeacherTimetable() {
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        
        Object principal = auth.getPrincipal();
        String email = null;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        }
        
        if (email == null) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }

        java.util.Optional<Teacher> teacherOpt = teacherRepository.findByEmail(email);
        if (teacherOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }
        Teacher teacher = teacherOpt.get();

        List<Map<String, Object>> result = timetableRepo.findByTeacher(teacher)
                .stream()
                .filter(t -> t.getBatch() == null || t.getBatch().getEndDate() == null
                        || !t.getBatch().getEndDate().isBefore(LocalDate.now()))
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── PARENT endpoint
    @Transactional
    @GetMapping("/parent")
    @PreAuthorize("hasAnyRole('ADMIN','PARENT')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParentTimetable() {
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        
        Object principal = auth.getPrincipal();
        String email = null;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        }
        
        if (email == null) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }

        java.util.Optional<Parent> parentOpt = parentRepository.findByEmail(email);
        if (parentOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }
        Parent parent = parentOpt.get();

        List<Map<String, Object>> result = parentChildRepository.findByParent(parent).stream()
                .filter(pc -> pc.getChild() != null)
                .flatMap(pc -> {
                    Student child = pc.getChild();
                    // 1. Slots via batches
                    List<TimetableSlot> batchSlots = batchRepository.findAll().stream()
                            .filter(b -> b.getStudents().stream().anyMatch(s -> s.getId().equals(child.getId())))
                            .filter(b -> b.getEndDate() == null || !b.getEndDate().isBefore(LocalDate.now()))
                            .flatMap(b -> timetableRepo.findByBatch(b).stream())
                            .toList();

                    // 2. Slots via direct courses
                    List<Course> directCourses = courseRepository.findDirectlyEnrolledByStudentId(child.getId());
                    List<TimetableSlot> directCourseSlots = timetableRepo.findAll().stream()
                            .filter(slot -> slot.getBatch() == null && directCourses.contains(slot.getCourse()))
                            .toList();

                    List<TimetableSlot> combined = new ArrayList<>();
                    combined.addAll(batchSlots);
                    combined.addAll(directCourseSlots);
                    return combined.stream();
                })
                .map(this::toMap)
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Notification helper ────────────────────────────────────────────────────
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

    private List<String> sendTimetableNotifications(TimetableSlot slot, Batch batch, Admin admin) {
        String courseTitle  = slot.getCourse() != null ? slot.getCourse().getTitle() : "—";
        String teacherName  = slot.getTeacher() != null ? slot.getTeacher().getName() : "—";
        String teacherEmail = slot.getTeacher() != null ? slot.getTeacher().getEmail() : null;
        String day          = slot.getDayOfWeek();
        String time         = slot.getStartTime().toString() + " – " + slot.getEndTime().toString();
        String batchName    = batch.getName();
        String room         = slot.getRoom() != null ? slot.getRoom() : "—";
        String creatorName  = admin != null ? admin.getName() : "Admin";

        String notifTitle = "📅 Timetable Updated: " + courseTitle;
        String notifMsg   = day + " " + time + " · " + courseTitle + " · " + batchName;

        String html = buildTimetableEmail(courseTitle, teacherName, day, time, batchName, room, creatorName);

        Set<Student> students = batch.getStudents() != null ? batch.getStudents() : Set.of();
        List<String> studentEmails = students.stream().map(Student::getEmail).collect(Collectors.toList());

        // Parent emails
        List<String> parentEmails = students.stream()
                .flatMap(s -> parentChildRepository.findByChild(s).stream()
                        .filter(pc -> pc.getParent() != null)
                        .map(pc -> pc.getParent().getEmail()))
                .distinct().collect(Collectors.toList());

        // In-app notifications
        studentEmails.forEach(e -> saveNotif(e, notifTitle, notifMsg, Notification.NotificationType.INFO));
        parentEmails.forEach(e  -> saveNotif(e, notifTitle, notifMsg, Notification.NotificationType.INFO));
        if (teacherEmail != null) saveNotif(teacherEmail, notifTitle, notifMsg, Notification.NotificationType.INFO);

        // Emails
        Admin senderAdmin = resolveSuperAdmin(admin);
        String senderName = senderAdmin != null ? senderAdmin.getName() : creatorName;
        String senderEmail = senderAdmin != null ? senderAdmin.getEmail() : null;

        List<String> warnings = new ArrayList<>();
        List<EmailService.EmailResult> sr = emailService.sendToAll(studentEmails, notifTitle, html, senderName, senderEmail);
        List<EmailService.EmailResult> pr = emailService.sendToAll(parentEmails,  notifTitle, html, senderName, senderEmail);
        sr.forEach(r -> { if (r.isError()) warnings.add(r.getUserMessage()); });
        pr.forEach(r -> { if (r.isError()) warnings.add(r.getUserMessage()); });
        if (teacherEmail != null) {
            EmailService.EmailResult tr = emailService.send(teacherEmail, notifTitle, html, senderName, senderEmail);
            if (tr.isError()) warnings.add(tr.getUserMessage());
        }

        log.info("Timetable notifications: {} students, {} parents, teacher: {} (from: {})",
                studentEmails.size(), parentEmails.size(), teacherEmail, senderName);
        return warnings.stream().distinct().collect(Collectors.toList());
    }

    private void saveNotif(String email, String title, String msg, Notification.NotificationType type) {
        notificationRepository.save(Notification.builder()
                .recipientEmail(email).title(title).message(msg).type(type).read(false).build());
    }

    // ── HTML Email Template ────────────────────────────────────────────────────
    private String buildTimetableEmail(String course, String teacher, String day, String time,
                                        String batch, String room, String createdBy) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;">📅 ZenelaitLMS</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">Timetable Updated by Administrator</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">New Class Scheduled</h3>
                <table style="width:100%%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#7c3aed;">
                      <th style="padding:10px 14px;text-align:left;color:#fff;font-size:13px;">Field</th>
                      <th style="padding:10px 14px;text-align:left;color:#fff;font-size:13px;">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Course</td><td style="padding:10px 14px;font-weight:700;border-bottom:1px solid #e5e7eb;">%s</td></tr>
                    <tr><td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Teacher</td><td style="padding:10px 14px;font-weight:600;border-bottom:1px solid #e5e7eb;">%s</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Day</td><td style="padding:10px 14px;font-weight:600;color:#7c3aed;border-bottom:1px solid #e5e7eb;">%s</td></tr>
                    <tr><td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Time</td><td style="padding:10px 14px;font-weight:700;border-bottom:1px solid #e5e7eb;">%s</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Batch</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">%s</td></tr>
                    <tr><td style="padding:10px 14px;color:#6b7280;">Room</td><td style="padding:10px 14px;">%s</td></tr>
                  </tbody>
                </table>
                <p style="color:#6b7280;font-size:13px;margin-top:20px;">Created by <strong>%s</strong>. Login to ZenelaitLMS to view your full timetable.</p>
              </div>
            </div>
            """.formatted(course, teacher, day, time, batch, room, createdBy);
    }

    // ── Map helper ─────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(TimetableSlot t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        t.getId());
        m.put("dayOfWeek", t.getDayOfWeek());
        m.put("startTime", t.getStartTime().toString());
        m.put("endTime",   t.getEndTime().toString());
        m.put("room",      t.getRoom());
        if (t.getCourse() != null) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("id",    t.getCourse().getId());
            c.put("title", t.getCourse().getTitle());
            c.put("department", t.getCourse().getDepartment());
            c.put("studentCount", t.getCourse().getEnrolledStudents() != null ? t.getCourse().getEnrolledStudents().size() : 0);
            m.put("course", c);
        }
        if (t.getTeacher() != null) {
            Map<String, Object> tc = new LinkedHashMap<>();
            tc.put("id",   t.getTeacher().getId());
            tc.put("name", t.getTeacher().getName());
            m.put("teacher", tc);
        }
        if (t.getBatch() != null) {
            Map<String, Object> b = new LinkedHashMap<>();
            b.put("id",   t.getBatch().getId());
            b.put("name", t.getBatch().getName());
            b.put("endDate", t.getBatch().getEndDate() != null ? t.getBatch().getEndDate().toString() : null);
            b.put("studentCount", t.getBatch().getStudents() != null ? t.getBatch().getStudents().size() : 0);
            m.put("batch", b);
        }
        m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        return m;
    }
}
