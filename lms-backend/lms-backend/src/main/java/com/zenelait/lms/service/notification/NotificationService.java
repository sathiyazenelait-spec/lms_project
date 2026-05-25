package com.zenelait.lms.service.notification;

import com.zenelait.lms.entity.*;
import com.zenelait.lms.repository.*;
import com.zenelait.lms.service.mail.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AdminRepository        adminRepository;
    private final ParentChildRepository  parentChildRepository;
    private final StudentRepository      studentRepository;
    private final EmailService           emailService;
    
    private final AttendanceRepository attendanceRepository;

 // ── Helpers ────────────────────────────────────────────────────────────────

    private String[] resolveSuperAdminDetails(Long orgId) {
        if (orgId != null) {
            List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(orgId);
            if (!superAdmins.isEmpty()) {
                Admin sa = superAdmins.get(0);
                return new String[]{sa.getName(), sa.getEmail()};
            }
        }
        return new String[]{"ZenelaitLMS", null};
    }

    private void saveNotif(String recipientEmail, String title, String message,
                           Notification.NotificationType type) {
        notificationRepository.save(Notification.builder()
                .recipientEmail(recipientEmail)
                .title(title)
                .message(message)
                .type(type)
                .read(false)
                .build());
    }

    private List<String> getAllAdminEmails() {
        return adminRepository.findAll().stream()
                .map(Admin::getEmail)
                .collect(Collectors.toList());
    }

    private List<String> getParentEmailsForStudent(Long studentId) {
        return studentRepository.findById(studentId)
                .map(student -> (List<String>) parentChildRepository.findByChild(student).stream()
                        .filter(pc -> pc.getParent() != null)
                        .map(pc -> pc.getParent().getEmail())
                        .distinct()
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    /**
     * Collects user-facing warning messages from email results.
     * - INVALID_ADDRESS → "Can't reach the email: x@y.z"
     * - FAILED          → "Failed to send mail to x@y.z"
     * - SENT/DISABLED   → ignored (no warning)
     */
    private List<String> collectWarnings(List<EmailService.EmailResult> results) {
        return results.stream()
                .filter(EmailService.EmailResult::isError)
                .map(EmailService.EmailResult::getUserMessage)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<String> sendAndCollect(List<String> emails, String subject, String html,
                                         String senderName, String senderEmail) {
        List<EmailService.EmailResult> results = emailService.sendToAll(emails, subject, html, senderName, senderEmail);
        return collectWarnings(results);
    }

    private List<String> sendAndCollect(String email, String subject, String html,
                                         String senderName, String senderEmail) {
        EmailService.EmailResult r = emailService.send(email, subject, html, senderName, senderEmail);
        return r.isError() ? List.of(r.getUserMessage()) : List.of();
    }

    public void sendAnnouncementNotification(Announcement announcement, List<String> studentEmails, String senderName, String senderEmail) {
        String title = "📢 " + announcement.getTitle();
        String message = announcement.getContent();

        // In-app notifications
        for (String email : studentEmails) {
            saveNotif(email, title, message, Notification.NotificationType.INFO);
        }

        // Email notifications
        if (!studentEmails.isEmpty()) {
            emailService.sendToAll(studentEmails, title, message, senderName, senderEmail);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    private List<String> getOrgAdminEmails(Long orgId) {
        if (orgId == null) {
            return getAllAdminEmails();
        }
        return adminRepository.findByOrganizationId(orgId).stream()
                .map(Admin::getEmail)
                .collect(Collectors.toList());
    }

    // ── Register ───────────────────────────────────────────────────────

    public List<String> onStudentRegistered(Student student) {
        String title = "🎓 New Student Registered";
        String msg   = student.getName() + " (" + student.getUserId() + ") joined as a student in " +
                       (student.getDepartment() != null ? student.getDepartment() : "—");
        String html  = emailService.newRegistrationEmail("Student",
                 student.getName(), student.getEmail(), student.getUserId());

        List<String> adminEmails = getOrgAdminEmails(student.getOrganizationId());
        adminEmails.forEach(email -> saveNotif(email, title, msg, Notification.NotificationType.INFO));
        String[] saDetails = resolveSuperAdminDetails(student.getOrganizationId());
        List<String> warnings = sendAndCollect(adminEmails, title, html, saDetails[0], saDetails[1]);
        log.info("Registration notifications sent to {} admin(s) for student {}", adminEmails.size(), student.getName());
        return warnings;
    }

    public List<String> onTeacherRegistered(Teacher teacher) {
        String title = "👨‍🏫 New Teacher Registered";
        String msg   = teacher.getName() + " (" + teacher.getUserId() + ") joined as a teacher in " +
                       (teacher.getDepartment() != null ? teacher.getDepartment() : "—");
        String html  = emailService.newRegistrationEmail("Teacher",
                teacher.getName(), teacher.getEmail(), teacher.getUserId());

        List<String> adminEmails = getOrgAdminEmails(teacher.getOrganizationId());
        adminEmails.forEach(email -> saveNotif(email, title, msg, Notification.NotificationType.INFO));
        String[] saDetails = resolveSuperAdminDetails(teacher.getOrganizationId());
        return sendAndCollect(adminEmails, title, html, saDetails[0], saDetails[1]);
    }

    public List<String> onParentRegistered(Parent parent) {
        String title = "👨‍👩‍👧 New Parent Registered";
        String msg   = parent.getName() + " (" + parent.getUserId() + ") joined as a parent.";
        String html  = emailService.newRegistrationEmail("Parent",
                parent.getName(), parent.getEmail(), parent.getUserId());

        List<String> adminEmails = getOrgAdminEmails(parent.getOrganizationId());
        adminEmails.forEach(email -> saveNotif(email, title, msg, Notification.NotificationType.INFO));
        String[] saDetails = resolveSuperAdminDetails(parent.getOrganizationId());
        return sendAndCollect(adminEmails, title, html, saDetails[0], saDetails[1]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. MATERIAL UPLOADED → notify students + parents + admins (in-app + email)
    // ══════════════════════════════════════════════════════════════════════════

    public List<String> onMaterialUploaded(CourseMaterial material, List<Student> students) {
        String materialType  = material.getType().name();
        String materialTitle = material.getTitle();
        String courseTitle   = material.getCourse() != null ? material.getCourse().getTitle() : "—";
        String teacherName   = material.getUploadedBy() != null ? material.getUploadedBy().getName() : "Teacher";
        String teacherEmail  = material.getUploadedBy() != null ? material.getUploadedBy().getEmail() : null;

        String notifTitle = switch (material.getType()) {
            case NOTE      -> "📝 New Note: " + materialTitle;
            case VIDEO     -> "🎥 New Video: " + materialTitle;
            case MEET_LINK -> "🔗 Live Class: " + materialTitle;
        };
        String notifMsg = "Uploaded by " + teacherName + " for " + courseTitle;

        String html = emailService.materialUploadEmail(
                teacherName, courseTitle, materialType, materialTitle,
                material.getDescription(),
                material.getType() != CourseMaterial.MaterialType.NOTE ? material.getContent() : null);

        // Collect all parent emails for enrolled students
        List<String> parentEmails = students.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct()
                .collect(Collectors.toList());

        Long orgId = material.getUploadedBy() != null ? material.getUploadedBy().getOrganizationId() : null;
        List<String> adminEmails = getOrgAdminEmails(orgId);

        // ── In-app notifications ──
        students.forEach(s     -> saveNotif(s.getEmail(),     notifTitle, notifMsg, Notification.NotificationType.INFO));
        parentEmails.forEach(e -> saveNotif(e,                notifTitle, notifMsg, Notification.NotificationType.INFO));
        adminEmails.forEach(e  -> saveNotif(e,                notifTitle, notifMsg, Notification.NotificationType.INFO));

        List<String> studentEmails = students.stream().map(Student::getEmail).collect(Collectors.toList());
        List<String> warnings = new ArrayList<>();
        warnings.addAll(sendAndCollect(studentEmails, notifTitle, html, teacherName, teacherEmail));
        warnings.addAll(sendAndCollect(parentEmails,  notifTitle, html, teacherName, teacherEmail));
        warnings.addAll(sendAndCollect(adminEmails,   notifTitle, html, teacherName, teacherEmail));
        if (teacherEmail != null) {
            String confirm = html.replace("New material uploaded for your course",
                    "Your material was uploaded and " + students.size() + " student(s) notified.");
            String[] saDetails = resolveSuperAdminDetails(orgId);
            warnings.addAll(sendAndCollect(teacherEmail,
                    "✅ Material uploaded: " + materialTitle, confirm, saDetails[0], saDetails[1]));
        }
        log.info("Material notifications: {} students, {} parents, {} admins",
                students.size(), parentEmails.size(), adminEmails.size());
        return warnings.stream().distinct().collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. FEE ADDED → notify student + linked parents (in-app + email)
    // ══════════════════════════════════════════════════════════════════════════

    public List<String> onFeeAdded(Fee fee, String senderName, String senderEmail) {
        Student student = fee.getStudent();
        if (student == null) return List.of();

        String courseName = fee.getCourse() != null ? fee.getCourse().getTitle() :
                           (fee.getBatch() != null ? fee.getBatch().getName() : "General");
        String amount     = fee.getAmount() != null ? fee.getAmount().toPlainString() : "—";
        String dueDate    = fee.getDueDate() != null ? fee.getDueDate().toString() : "—";
        String feeType    = fee.getFeeType() != null ? fee.getFeeType().name() : "TUITION";

        // Fallback to system sender if not provided
        String fromName  = (senderName  != null && !senderName.isBlank())  ? senderName  : "ZenelaitLMS Admin";
        String fromEmail = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail : null;

        String notifTitle = "💳 New Fee: ₹" + amount + " due " + dueDate;
        String notifMsg   = feeType + " fee for " + courseName + " — ₹" + amount + " due by " + dueDate;

        String html = emailService.feeNotificationEmail(
                student.getName(), courseName, feeType, amount, dueDate, fee.getDescription());

        // In-app: student
        saveNotif(student.getEmail(), notifTitle, notifMsg, Notification.NotificationType.WARNING);
        List<String> feeWarnings = new ArrayList<>();
        feeWarnings.addAll(sendAndCollect(student.getEmail(), notifTitle, html, fromName, fromEmail));

        List<String> parentEmails = getParentEmailsForStudent(student.getId());
        parentEmails.forEach(e -> saveNotif(e,
                "💳 Fee Notice for " + student.getName(),
                "₹" + amount + " due by " + dueDate + " — " + feeType + " (" + courseName + ")",
                Notification.NotificationType.WARNING));
        feeWarnings.addAll(sendAndCollect(parentEmails,
                "💳 Fee Notice for " + student.getName(), html, fromName, fromEmail));

        log.info("Fee notifications sent for student {} to {} parent(s) (from: {})",
                student.getName(), parentEmails.size(), fromName);
        return feeWarnings.stream().distinct().collect(Collectors.toList());
    }

    /** Overload for backward-compat — falls back to system sender */
    public List<String> onFeeAdded(Fee fee) {
        String[] saDetails = resolveSuperAdminDetails(fee.getStudent() != null ? fee.getStudent().getOrganizationId() : null);
        return onFeeAdded(fee, saDetails[0], saDetails[1]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. COURSE CREATED → notify relevant parties (in-app + email)
    //    - Teacher creates course → admins + batch students + linked parents
    //    - Admin creates course   → assigned teacher + batch students + linked parents
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @param course      the newly created course
     * @param batch       the batch it was assigned to (can be null)
     * @param createdBy   "TEACHER" or "ADMIN"
     * @param creatorName name of who created it
     * @param creatorEmail email of creator (for Reply-To)
     */
    public List<String> onCourseCreated(Course course, Batch batch,
                                 String createdBy, String creatorName, String creatorEmail) {

        String courseTitle = course.getTitle();
        String dept        = course.getDepartment() != null ? course.getDepartment() : "—";
        String batchName   = batch != null ? batch.getName() : "No batch";
        String teacherName = course.getTeacher() != null ? course.getTeacher().getName() : "Unassigned";
        String teacherEmail= course.getTeacher() != null ? course.getTeacher().getEmail() : null;

        String notifTitle = "📚 New Course: " + courseTitle;
        String notifMsg   = "Created by " + creatorName + " · " + dept + " · Batch: " + batchName;

        String html = courseCreatedEmail(courseTitle, dept, batchName, teacherName, createdBy, creatorName);

        // ── Collect recipients ────────────────────────────────────────────────

        // Students in the batch + their parents
        List<Student> students = batch != null
                ? batch.getStudents().stream().distinct().collect(java.util.stream.Collectors.toList())
                : List.of();

        List<String> parentEmails = students.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        List<String> studentEmails = students.stream()
                .map(Student::getEmail)
                .collect(java.util.stream.Collectors.toList());

        List<String> adminEmails = getOrgAdminEmails(course.getOrganizationId());

        // ── In-app notifications ──────────────────────────────────────────────

        // Always notify students + parents
        students.forEach(s -> saveNotif(s.getEmail(), notifTitle, notifMsg, Notification.NotificationType.INFO));
        parentEmails.forEach(e -> saveNotif(e, notifTitle, notifMsg, Notification.NotificationType.INFO));

        if ("TEACHER".equals(createdBy)) {
            // Teacher created → notify all admins
            adminEmails.forEach(e -> saveNotif(e,
                    "📚 Teacher created course: " + courseTitle,
                    creatorName + " created \"" + courseTitle + "\" in " + dept + " · Batch: " + batchName,
                    Notification.NotificationType.INFO));
        } else {
            // Admin created → notify the assigned teacher
            if (teacherEmail != null) {
                saveNotif(teacherEmail,
                        "📚 New course assigned to you: " + courseTitle,
                        "Admin assigned you to teach \"" + courseTitle + "\" in " + dept + " · Batch: " + batchName,
                        Notification.NotificationType.INFO);
            }
        }

        // ── Emails ────────────────────────────────────────────────────────────

        List<String> courseWarnings = new ArrayList<>();
        courseWarnings.addAll(sendAndCollect(studentEmails, notifTitle, html, creatorName, creatorEmail));
        courseWarnings.addAll(sendAndCollect(parentEmails,  notifTitle, html, creatorName, creatorEmail));
        if ("TEACHER".equals(createdBy)) {
            courseWarnings.addAll(sendAndCollect(adminEmails, notifTitle, html, creatorName, creatorEmail));
        } else {
            if (teacherEmail != null) {
                courseWarnings.addAll(sendAndCollect(teacherEmail,
                        "📚 New course assigned to you: " + courseTitle, html, creatorName, creatorEmail));
            }
        }
        log.info("Course notifications: {} students, {} parents, {} admins, teacher: {}",
                students.size(), parentEmails.size(), adminEmails.size(), teacherEmail);
        return courseWarnings.stream().distinct().collect(Collectors.toList());
    }

    // ── Email template for course creation ───────────────────────────────────
    private String courseCreatedEmail(String courseTitle, String dept, String batchName,
                                       String teacherName, String createdBy, String creatorName) {
        String icon = "TEACHER".equals(createdBy) ? "👨‍🏫" : "🏫";
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;">📚 ZenelaitLMS</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">New Course Available</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">%s %s created a new course</h3>
                <table style="width:100%%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:130px;">Course</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#111827;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Department</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Batch</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Teacher</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                </table>
                <p style="color:#6b7280;font-size:13px;margin-top:20px;">Login to ZenelaitLMS to view the course details.</p>
              </div>
            </div>
            """.formatted(icon, creatorName, courseTitle, dept, batchName, teacherName);
    }

    public void sendAttendanceNotification(Student student, Attendance attendance,
                                            String teacherName, String teacherEmail) {

        String studentName = student.getName();

        // Fallback if teacher info not provided
        String fromName  = (teacherName  != null && !teacherName.isBlank())  ? teacherName  : "ZenelaitLMS";
        String fromEmail = (teacherEmail != null && !teacherEmail.isBlank()) ? teacherEmail : null;

        List<String> parentEmails = getParentEmailsForStudent(student.getId());

        String notifTitle = "📌 Attendance Update: " + studentName;
        String notifMsg;
        String emailBody;

        switch (attendance.getStatus()) {
            case PRESENT -> {
                notifMsg = studentName + " is present today, doing well!";
                emailBody = """
                    <div style="font-family:Arial,sans-serif;">
                      <p>Hello,</p>
                      <p>%s is present today and doing well in class.</p>
                      <p>Regards,<br/>%s</p>
                    </div>
                    """.formatted(studentName, fromName);
            }
            case ABSENT -> {
                notifMsg = studentName + " is absent today. Please contact the administrator.";
                emailBody = """
                    <div style="font-family:Arial,sans-serif;">
                      <p>Hello,</p>
                      <p>%s is absent today. Please contact the administrator for the reason.</p>
                      <p>Regards,<br/>%s</p>
                    </div>
                    """.formatted(studentName, fromName);
            }
            case LATE -> {
                notifMsg = studentName + " is late today. Please contact the administrator.";
                emailBody = """
                    <div style="font-family:Arial,sans-serif;">
                      <p>Hello,</p>
                      <p>%s arrived late today. Please contact the administrator.</p>
                      <p>Regards,<br/>%s</p>
                    </div>
                    """.formatted(studentName, fromName);
            }
            default -> {
                notifMsg = studentName + " attendance updated.";
                emailBody = "<p>" + notifMsg + "</p>";
            }
        }

        // ── In-app notifications
        parentEmails.forEach(email -> saveNotif(email, notifTitle, notifMsg, Notification.NotificationType.INFO));

        // ── Email (from: teacher who marked attendance)
        sendAndCollect(parentEmails, notifTitle, emailBody, fromName, fromEmail);
        log.info("Attendance notification sent for {} to {} parent(s) (from: {})",
                studentName, parentEmails.size(), fromName);
    }

    /** Overload for backward-compat */
    public void sendAttendanceNotification(Student student, Attendance attendance) {
        String teacherName = null;
        String teacherEmail = null;
        if (attendance.getCourse() != null && attendance.getCourse().getTeacher() != null) {
            teacherName = attendance.getCourse().getTeacher().getName();
            teacherEmail = attendance.getCourse().getTeacher().getEmail();
        }
        if (teacherName == null) {
            String[] saDetails = resolveSuperAdminDetails(student.getOrganizationId());
            teacherName = saDetails[0];
            teacherEmail = saDetails[1];
        }
        sendAttendanceNotification(student, attendance, teacherName, teacherEmail);
    }
    
 // ══════════════════════════════════════════════════════════════════════════
    // EXAM NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════

    public void onExamCreated(com.zenelait.lms.entity.Exam exam,
                               java.util.List<com.zenelait.lms.entity.Student> allStudents,
                               String teacherName, String teacherEmail,
                               String courseTitle, String batchName,
                               boolean modeAll) {

        String title     = "📝 Exam Scheduled: " + exam.getTitle();
        String scheduled = exam.getScheduledAt() != null ? exam.getScheduledAt().toString() : "TBD";
        String duration  = exam.getDurationMinutes() + " min";
        String maxMarks  = String.valueOf(exam.getMaxMarks());

        // Students get invite notification
        String studentMsg = "You are invited for the exam \"" + exam.getTitle() + "\" on " + scheduled
                + ". Duration: " + duration + ". Max Marks: " + maxMarks + ". Be ready!";

        String studentHtml = examInviteEmail(exam.getTitle(), courseTitle, batchName,
                scheduled, duration, maxMarks, teacherName);

        allStudents.forEach(s -> saveNotif(s.getEmail(), title, studentMsg, Notification.NotificationType.INFO));
        List<String> studentEmails = allStudents.stream()
                .map(com.zenelait.lms.entity.Student::getEmail).collect(Collectors.toList());
        sendAndCollect(studentEmails, title, studentHtml, teacherName, teacherEmail);

        // Parents get invite + warning for unrecommended students (handled separately in controller,
        // here we notify all parents of all course students)
        List<String> parentEmails = allStudents.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct().collect(Collectors.toList());

        parentEmails.forEach(e -> saveNotif(e, "📝 Exam Notice for your ward: " + exam.getTitle(),
                studentMsg, Notification.NotificationType.INFO));
        sendAndCollect(parentEmails, "📝 Exam Notice: " + exam.getTitle(), studentHtml, teacherName, teacherEmail);

        // Admins get notification
        String adminMsg = "Teacher " + teacherName + " created exam \"" + exam.getTitle()
                + "\" for " + courseTitle + " (Batch: " + batchName + ") scheduled at " + scheduled;
        Long orgId = exam.getCourse() != null ? exam.getCourse().getOrganizationId() : (exam.getTeacher() != null ? exam.getTeacher().getOrganizationId() : null);
        List<String> orgAdmins = getOrgAdminEmails(orgId);
        orgAdmins.forEach(e -> saveNotif(e, "📝 Exam Created by " + teacherName, adminMsg, Notification.NotificationType.INFO));
        sendAndCollect(orgAdmins, "📝 Exam Created: " + exam.getTitle(),
                simpleHtml("📝 Exam Created", adminMsg), teacherName, teacherEmail);

        log.info("Exam-created notifications sent: {} students, {} parents", allStudents.size(), parentEmails.size());
    }

    public void onExamStarted(com.zenelait.lms.entity.Exam exam,
                               java.util.List<com.zenelait.lms.entity.ExamStudent> participants,
                               String teacherName, String teacherEmail) {

        String title = "🚀 Exam Started Now: " + exam.getTitle();
        String msg   = "The exam \"" + exam.getTitle() + "\" has started! Duration: "
                + exam.getDurationMinutes() + " min. Question paper sent if available. All the best!";

        List<com.zenelait.lms.entity.Student> students = participants.stream()
                .map(com.zenelait.lms.entity.ExamStudent::getStudent).collect(Collectors.toList());

        students.forEach(s -> saveNotif(s.getEmail(), title, msg, Notification.NotificationType.WARNING));
        List<String> studentEmails = students.stream()
                .map(com.zenelait.lms.entity.Student::getEmail).collect(Collectors.toList());
        sendAndCollect(studentEmails, title, simpleHtml("🚀 Exam Started", msg), teacherName, teacherEmail);

        List<String> parentEmails = students.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct().collect(Collectors.toList());
        parentEmails.forEach(e -> saveNotif(e, title, msg, Notification.NotificationType.WARNING));
        sendAndCollect(parentEmails, title, simpleHtml("🚀 Exam Started", msg), teacherName, teacherEmail);

        String adminMsg = "Exam \"" + exam.getTitle() + "\" started by " + teacherName;
        Long orgId = exam.getCourse() != null ? exam.getCourse().getOrganizationId() : (exam.getTeacher() != null ? exam.getTeacher().getOrganizationId() : null);
        List<String> orgAdmins = getOrgAdminEmails(orgId);
        orgAdmins.forEach(e -> saveNotif(e, title, adminMsg, Notification.NotificationType.INFO));
        log.info("Exam-started notifications sent for {}", exam.getTitle());
    }

    public void onExamPostponed(com.zenelait.lms.entity.Exam exam,
                                 java.util.List<com.zenelait.lms.entity.ExamStudent> participants,
                                 String teacherName, String teacherEmail) {

        String newDate = exam.getPostponedTo() != null ? exam.getPostponedTo().toString() : "TBD";
        String title   = "⏸ Exam Postponed: " + exam.getTitle();
        String msg     = "The exam \"" + exam.getTitle() + "\" has been postponed to " + newDate
                + ". New schedule will be confirmed soon. Contact your teacher for more details.";

        List<com.zenelait.lms.entity.Student> students = participants.stream()
                .map(com.zenelait.lms.entity.ExamStudent::getStudent).collect(Collectors.toList());

        students.forEach(s -> saveNotif(s.getEmail(), title, msg, Notification.NotificationType.WARNING));
        List<String> studentEmails = students.stream()
                .map(com.zenelait.lms.entity.Student::getEmail).collect(Collectors.toList());
        sendAndCollect(studentEmails, title, simpleHtml("⏸ Exam Postponed", msg), teacherName, teacherEmail);

        List<String> parentEmails = students.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct().collect(Collectors.toList());
        parentEmails.forEach(e -> saveNotif(e, title, msg, Notification.NotificationType.WARNING));
        sendAndCollect(parentEmails, title, simpleHtml("⏸ Exam Postponed", msg), teacherName, teacherEmail);

        String adminMsg = "Exam \"" + exam.getTitle() + "\" postponed by " + teacherName + " to " + newDate;
        Long orgId = exam.getCourse() != null ? exam.getCourse().getOrganizationId() : (exam.getTeacher() != null ? exam.getTeacher().getOrganizationId() : null);
        List<String> orgAdmins = getOrgAdminEmails(orgId);
        orgAdmins.forEach(e -> saveNotif(e, title, adminMsg, Notification.NotificationType.WARNING));
        sendAndCollect(orgAdmins, title, simpleHtml("⏸ Exam Postponed", adminMsg), teacherName, teacherEmail);
        log.info("Exam-postponed notifications sent for {}", exam.getTitle());
    }

    public void onExamCancelled(com.zenelait.lms.entity.Exam exam,
                                 java.util.List<com.zenelait.lms.entity.ExamStudent> participants,
                                 String teacherName, String teacherEmail) {

        String reason = exam.getCancellationReason() != null ? exam.getCancellationReason() : "Not specified";
        String title  = "❌ Exam Cancelled: " + exam.getTitle();
        String msg    = "The exam \"" + exam.getTitle() + "\" has been cancelled. Reason: " + reason
                + ". Please contact your teacher for more information.";

        List<com.zenelait.lms.entity.Student> students = participants.stream()
                .map(com.zenelait.lms.entity.ExamStudent::getStudent).collect(Collectors.toList());

        students.forEach(s -> saveNotif(s.getEmail(), title, msg, Notification.NotificationType.ERROR));
        List<String> studentEmails = students.stream()
                .map(com.zenelait.lms.entity.Student::getEmail).collect(Collectors.toList());
        sendAndCollect(studentEmails, title, simpleHtml("❌ Exam Cancelled", msg), teacherName, teacherEmail);

        List<String> parentEmails = students.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct().collect(Collectors.toList());
        parentEmails.forEach(e -> saveNotif(e, title, msg, Notification.NotificationType.ERROR));
        sendAndCollect(parentEmails, title, simpleHtml("❌ Exam Cancelled", msg), teacherName, teacherEmail);
        log.info("Exam-cancelled notifications sent for {}", exam.getTitle());
    }

    public void onExamDeleted(com.zenelait.lms.entity.Exam exam,
                               java.util.List<com.zenelait.lms.entity.ExamStudent> participants,
                               String teacherName, String teacherEmail) {

        String title = "🗑 Exam Removed: " + exam.getTitle();
        String msg   = "The exam \"" + exam.getTitle() + "\" has been permanently removed by the teacher. "
                + "No further action is needed.";

        List<com.zenelait.lms.entity.Student> students = participants.stream()
                .map(com.zenelait.lms.entity.ExamStudent::getStudent).collect(Collectors.toList());

        students.forEach(s -> saveNotif(s.getEmail(), title, msg, Notification.NotificationType.WARNING));
        List<String> parentEmails = students.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct().collect(Collectors.toList());
        parentEmails.forEach(e -> saveNotif(e, title, msg, Notification.NotificationType.WARNING));
        sendAndCollect(parentEmails, title, simpleHtml("🗑 Exam Removed", msg), teacherName, teacherEmail);
        log.info("Exam-deleted notifications sent for {}", exam.getTitle());
    }

    public void onExamFinished(com.zenelait.lms.entity.Exam exam,
                                java.util.List<com.zenelait.lms.entity.ExamResult> results,
                                java.util.List<com.zenelait.lms.entity.ExamStudent> participants,
                                String teacherName, String teacherEmail) {

        // Per-student result notification
        for (com.zenelait.lms.entity.ExamResult r : results) {
            com.zenelait.lms.entity.Student student = r.getStudent();
            String status = r.isCleared() ? "✅ PASSED" : "❌ NOT CLEARED";
            String marks  = r.getMarksObtained() != null ? r.getMarksObtained() + "/" + exam.getMaxMarks() : "—";

            String studentMsg = "Your result for \"" + exam.getTitle() + "\": "
                    + status + ", Marks: " + marks + ", Grade: " + (r.getGrade() != null ? r.getGrade() : "—");
            saveNotif(student.getEmail(), "📊 Exam Result: " + exam.getTitle(),
                    studentMsg, Notification.NotificationType.SUCCESS);

            String resultHtml = examResultEmail(student.getName(), exam.getTitle(),
                    marks, r.getGrade(), r.isCleared(), r.isAttended(), teacherName);
            sendAndCollect(student.getEmail(), "📊 Your Exam Result: " + exam.getTitle(),
                    resultHtml, teacherName, teacherEmail);

            // Parents
            List<String> parentEmails = getParentEmailsForStudent(student.getId());
            String parentMsg = student.getName() + "'s result for \"" + exam.getTitle() + "\": "
                    + status + ", Marks: " + marks;
            parentEmails.forEach(e -> saveNotif(e, "📊 Ward's Exam Result: " + exam.getTitle(),
                    parentMsg, Notification.NotificationType.SUCCESS));
            sendAndCollect(parentEmails, "📊 " + student.getName() + "'s Exam Result",
                    resultHtml, teacherName, teacherEmail);
        }

        // Admins
        long passed = results.stream().filter(com.zenelait.lms.entity.ExamResult::isCleared).count();
        String adminMsg = "Exam \"" + exam.getTitle() + "\" completed by " + teacherName
                + ". Passed: " + passed + "/" + results.size() + ". Status: COMPLETED.";
        Long orgId = exam.getCourse() != null ? exam.getCourse().getOrganizationId() : (exam.getTeacher() != null ? exam.getTeacher().getOrganizationId() : null);
        List<String> orgAdmins = getOrgAdminEmails(orgId);
        orgAdmins.forEach(e -> saveNotif(e, "📊 Exam Completed: " + exam.getTitle(),
                adminMsg, Notification.NotificationType.SUCCESS));
        log.info("Exam-finished notifications sent for {}", exam.getTitle());
    }

    public void onExamRescheduled(com.zenelait.lms.entity.Exam rescheduled,
                                   java.util.List<com.zenelait.lms.entity.Student> failedStudents,
                                   String teacherName, String teacherEmail, String originalTitle) {

        String title = "🔁 Rescheduled Exam: " + rescheduled.getTitle();
        String msg   = "A rescheduled exam has been created for students who did not clear \""
                + originalTitle + "\". Exam: \"" + rescheduled.getTitle()
                + "\". The teacher will announce the date soon.";

        failedStudents.forEach(s -> saveNotif(s.getEmail(), title, msg, Notification.NotificationType.WARNING));
        List<String> studentEmails = failedStudents.stream()
                .map(com.zenelait.lms.entity.Student::getEmail).collect(Collectors.toList());
        sendAndCollect(studentEmails, title, simpleHtml("🔁 Rescheduled Exam", msg), teacherName, teacherEmail);

        List<String> parentEmails = failedStudents.stream()
                .flatMap(s -> getParentEmailsForStudent(s.getId()).stream())
                .distinct().collect(Collectors.toList());
        parentEmails.forEach(e -> saveNotif(e, title, msg, Notification.NotificationType.WARNING));
        sendAndCollect(parentEmails, title, simpleHtml("🔁 Rescheduled Exam", msg), teacherName, teacherEmail);
        log.info("Exam-rescheduled notifications sent for {} failed students", failedStudents.size());
    }

    // ── Email templates ───────────────────────────────────────────────────────

    private String examInviteEmail(String examTitle, String courseTitle, String batchName,
                                    String scheduledAt, String duration, String maxMarks, String teacherName) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;">📝 ZenelaitLMS</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">Exam Invitation</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">You are invited for an upcoming exam</h3>
                <table style="width:100%%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:130px;">Exam</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#111827;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Course</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Batch</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Scheduled</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Duration</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Max Marks</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Teacher</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                </table>
                <p style="color:#6b7280;font-size:13px;margin-top:20px;">Please prepare well and be on time. All the best!</p>
              </div>
            </div>
            """.formatted(examTitle, courseTitle, batchName, scheduledAt, duration, maxMarks, teacherName);
    }

    private String examResultEmail(String studentName, String examTitle,
                                    String marks, String grade, boolean cleared, boolean attended, String teacherName) {
        String statusColor = cleared ? "#10b981" : "#ef4444";
        String statusText  = cleared ? "✅ PASSED" : "❌ NOT CLEARED";
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;">📊 ZenelaitLMS</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">Exam Result</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">Dear %s — Your result is ready</h3>
                <table style="width:100%%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:130px;">Exam</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#111827;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Marks</td><td style="padding:8px 0;font-weight:700;font-size:18px;color:#111827;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Grade</td><td style="padding:8px 0;font-weight:700;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Status</td><td style="padding:8px 0;font-weight:700;color:%s;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Attended</td><td style="padding:8px 0;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Evaluated by</td><td style="padding:8px 0;">%s</td></tr>
                </table>
              </div>
            </div>
            """.formatted(studentName, examTitle, marks, grade != null ? grade : "—",
                statusColor, statusText, attended ? "Yes" : "No", teacherName);
    }

    private String simpleHtml(String heading, String body) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:24px 32px;">
                <h2 style="color:#fff;margin:0;">ZenelaitLMS</h2>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">%s</h3>
                <p style="color:#374151;line-height:1.7;">%s</p>
                <p style="color:#6b7280;font-size:13px;margin-top:24px;">ZenelaitLMS Team</p>
              </div>
            </div>
            """.formatted(heading, body);
    }

    public void onAdminCertificateIssued(AdminCertificate cert, String recipientEmail,
                                          String senderName, String senderEmail) {
        String title = "🏆 New Certificate Issued: " + cert.getTitle();
        String msg = "A new certificate has been issued to you by " + cert.getIssuedBy() + ".";

        // Fallback to system sender if not provided
        String fromName  = (senderName  != null && !senderName.isBlank())  ? senderName  : "ZenelaitLMS Admin";
        String fromEmail = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail : null;

        saveNotif(recipientEmail, title, msg, Notification.NotificationType.SUCCESS);

        String html = simpleHtml("🏆 Certificate Issued",
                "Congratulations! You have been issued a new certificate: <strong>" + cert.getTitle() + "</strong> by " + cert.getIssuedBy() + " on " + cert.getIssueDate() + ".<br/><br/><i>\"" + cert.getBodyContent() + "\"</i>");

        sendAndCollect(recipientEmail, title, html, fromName, fromEmail);
        log.info("Admin certificate notification sent to {} (from: {})", recipientEmail, fromName);
    }

    /** Overload for backward-compat */
    public void onAdminCertificateIssued(AdminCertificate cert, String recipientEmail) {
        String[] saDetails = resolveSuperAdminDetails(cert.getOrganizationId());
        onAdminCertificateIssued(cert, recipientEmail, saDetails[0], saDetails[1]);
    }

}
