package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.razorpay.RazorpayClient;
import com.zenelait.lms.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PARENT')")
public class ParentController {

    private final ParentRepository       parentRepository;
    private final ParentChildRepository  parentChildRepository;
    private final FeeRepository          feeRepository;
    private final AttendanceRepository   attendanceRepository;
    private final CourseRepository       courseRepository;
    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final StudentRepository      studentRepository;
    private final ParentWalletRepository parentWalletRepository;
    private final AssessmentAttemptRepository assessmentAttemptRepository;
    private final RazorpayOrderRepository razorpayOrderRepository;
    private final BatchRepository        batchRepository;
    private final ExamRepository         examRepository;
    private final ExamResultRepository   examResultRepository;
    private final ExamStudentRepository  examStudentRepository;

    @Value("${razorpay.key:rzp_test_placeholderkey}")
    private String razorpayKey;

    @Value("${razorpay.secret:placeholdersecret}")
    private String razorpaySecret;

    /**
     * Private helper to securely fetch and load the authenticated parent fresh from DB by email.
     * Bypasses fragile @AuthenticationPrincipal proxy conflicts.
     */
    private Parent getAuthenticatedParent() {
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResourceNotFoundException("Unauthorized: No authenticated context found");
        }
        Object principal = auth.getPrincipal();
        final String email;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        } else {
            throw new ResourceNotFoundException("Invalid user context: No email found");
        }
        if (email == null) {
            throw new ResourceNotFoundException("Invalid user context: No email found");
        }
        return parentRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found for email: " + email));
    }

    // ── Profile ───────────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Parent>> getProfile() {
        Parent parent = getAuthenticatedParent();
        Parent fresh = parentRepository.findById(parent.getId()).orElse(parent);
        return ResponseEntity.ok(ApiResponse.ok(fresh));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Parent>> updateProfile(@RequestBody Map<String, String> body) {
        Parent parent = getAuthenticatedParent();
        Parent fresh = parentRepository.findById(parent.getId()).orElse(parent);
        if (body.containsKey("name"))          fresh.setName(body.get("name"));
        if (body.containsKey("phone"))         fresh.setPhone(body.get("phone"));
        if (body.containsKey("address"))       fresh.setAddress(body.get("address"));
        if (body.containsKey("gender"))        fresh.setGender(body.get("gender"));
        if (body.containsKey("profilePicUrl")) fresh.setProfilePicUrl(body.get("profilePicUrl"));
        parentRepository.save(fresh);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", fresh));
    }

    // ── Children ──────────────────────────────────────────────────────
    @Transactional
    @GetMapping("/children")
    public ResponseEntity<ApiResponse<List<Student>>> getChildren() {
        Parent parent = getAuthenticatedParent();
        List<Student> children = parentChildRepository.findByParent(parent)
                .stream()
                .map(ParentChild::getChild)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    /**
     * Link a child by their student userId code (e.g. STU-2026-001).
     * Body: { "studentCode": "STU-2026-001" }
     */
    @Transactional
    @PostMapping("/children/link")
    public ResponseEntity<ApiResponse<Void>> linkChild(@RequestBody Map<String, String> body) {
        Parent parent = getAuthenticatedParent();
        String studentCode = body.get("studentCode");
        if (studentCode == null || studentCode.isBlank()) {
            throw new ResourceNotFoundException("Student code is required");
        }
        Student student = studentRepository.findByUserId(studentCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No student found with code: " + studentCode));

        boolean alreadyLinked = parentChildRepository.findByParent(parent)
                .stream()
                .anyMatch(pc -> pc.getChild().getId().equals(student.getId()));
        if (alreadyLinked) {
            throw new ResourceNotFoundException("This child is already linked to your account");
        }

        ParentChild link = ParentChild.builder().parent(parent).child(student).build();
        parentChildRepository.save(link);
        return ResponseEntity.ok(ApiResponse.ok("Child linked successfully", null));
    }

    // ── Child Fee & Attendance ────────────────────────────────────────
    @Transactional
    @GetMapping("/children/{childId}/fees")
    public ResponseEntity<ApiResponse<List<Fee>>> getChildFees(@PathVariable Long childId) {
        Parent parent = getAuthenticatedParent();
        Student child = getVerifiedChild(parent, childId);
        return ResponseEntity.ok(ApiResponse.ok(feeRepository.findByStudent(child)));
    }

    @Transactional
    @GetMapping("/children/{childId}/attendance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChildAttendance(
            @PathVariable Long childId,
            @RequestParam Long courseId) {
        Parent parent = getAuthenticatedParent();
        Student child  = getVerifiedChild(parent, childId);
        Course  course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        List<Attendance> records = attendanceRepository.findByStudentAndCourse(child, course);
        long present = attendanceRepository.countPresentByStudentAndCourse(child, course);
        long total   = attendanceRepository.countTotalByStudentAndCourse(child, course);
        double pct   = total > 0 ? (present * 100.0 / total) : 0;

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "records",    records,
                "present",    present,
                "total",      total,
                "percentage", String.format("%.1f", pct)
        )));
    }

    // ── Announcements & Notifications ─────────────────────────────────
    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> getAnnouncements() {
        return ResponseEntity.ok(ApiResponse.ok(
                announcementRepository.findByRoleOrGlobal(Role.PARENT)));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        Parent parent = getAuthenticatedParent();
        return ResponseEntity.ok(ApiResponse.ok(
                notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(parent.getEmail())));
    }

    // ── Helper ────────────────────────────────────────────────────────
    @Transactional
    protected Student getVerifiedChild(Parent parent, Long childId) {
        return parentChildRepository.findByParent(parent).stream()
                .map(ParentChild::getChild)
                .filter(c -> c.getId().equals(childId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Child not linked to this parent"));
    }

    @Transactional
    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationRead(@PathVariable Long id) {
        Parent parent = getAuthenticatedParent();
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipientEmail().equals(parent.getEmail())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }

    @Transactional
    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        Parent parent = getAuthenticatedParent();
        notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(parent.getEmail())
                .forEach(n -> { n.setRead(true); notificationRepository.save(n); });
        return ResponseEntity.ok(ApiResponse.ok("All read", null));
    }

    // ── WALLET & PAYMENT ──────────────────────────────────────────────
    /**
     * Get parent's wallet details
     */
    @Transactional
    @GetMapping("/wallet")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWallet() {
        Parent parent = getAuthenticatedParent();
        ParentWallet wallet = parentWalletRepository.findByParent(parent)
                .orElseGet(() -> {
                    ParentWallet newWallet = new ParentWallet();
                    newWallet.setParent(parent);
                    newWallet.setBalance(0.0);
                    return parentWalletRepository.save(newWallet);
                });

        Map<String, Object> data = new HashMap<>();
        data.put("id", wallet.getId());
        data.put("parentId", parent.getId());
        data.put("balance", wallet.getBalance());
        data.put("lastTransaction", wallet.getLastTransactionId() != null ? wallet.getLastTransactionId() : "");
        data.put("createdAt", wallet.getCreatedAt() != null ? wallet.getCreatedAt().toString() : "");
        data.put("updatedAt", wallet.getUpdatedAt() != null ? wallet.getUpdatedAt().toString() : "");

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /**
     * Get wallet balance only
     */
    @Transactional
    @GetMapping("/wallet/balance")
    public ResponseEntity<ApiResponse<Double>> getWalletBalance() {
        Parent parent = getAuthenticatedParent();
        Double balance = parentWalletRepository.findByParent(parent)
                .map(ParentWallet::getBalance)
                .orElse(0.0);
        return ResponseEntity.ok(ApiResponse.ok(balance));
    }

    /**
     * Add balance to parent wallet (after successful Razorpay payment)
     * Body: { "amount": 5000, "transactionId": "pay_xxx", "notes": "Wallet Recharge" }
     */
    @Transactional
    @PostMapping("/wallet/add-balance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addWalletBalance(@RequestBody Map<String, Object> body) {
        Parent parent = getAuthenticatedParent();
        Double amount = Double.valueOf(body.get("amount").toString());
        String transactionId = body.get("transactionId").toString();
        String notes = (String) body.get("notes");

        if (amount <= 0) {
            throw new RuntimeException("Amount must be greater than 0");
        }

        try {
            // Fetch payment details directly from Razorpay API to prevent front-end spoofing
            RazorpayClient razorpay = new RazorpayClient(razorpayKey, razorpaySecret);
            com.razorpay.Payment payment = razorpay.payments.fetch(transactionId);

            String paymentStatus = payment.get("status");
            if (!"captured".equals(paymentStatus) && !"authorized".equals(paymentStatus)) {
                throw new RuntimeException("Payment has not been authorized or captured on Razorpay. Current status: " + paymentStatus);
            }

            String orderId = payment.get("order_id");
            if (orderId == null) {
                throw new RuntimeException("Payment is not associated with any Razorpay Order ID");
            }

            // Retrieve the verified order from database
            RazorpayOrder razorpayOrder = razorpayOrderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Razorpay Order " + orderId + " not found in database"));

            // Verify order belongs to the authenticated parent
            if (!razorpayOrder.getEmail().equals(parent.getEmail())) {
                throw new RuntimeException("Security violation: Payment belongs to a different user");
            }

            // Verify order is still PENDING (prevents replay attacks)
            if (!"PENDING".equals(razorpayOrder.getStatus())) {
                throw new RuntimeException("This transaction has already been processed and credited");
            }

            // Verify amount matches what was paid
            Object amountObj = payment.get("amount");
            double razorpayPaidAmount;
            if (amountObj instanceof Number) {
                razorpayPaidAmount = ((Number) amountObj).doubleValue();
            } else {
                razorpayPaidAmount = Double.parseDouble(amountObj.toString());
            }

            double expectedAmountInPaise = amount * 100;
            if (Math.abs(razorpayPaidAmount - expectedAmountInPaise) > 1.0) { // allow tiny precision delta
                throw new RuntimeException("Paid amount mismatch. Expected: ₹" + amount + ", but paid: ₹" + (razorpayPaidAmount / 100.0));
            }

            // Mark order as SUCCESS
            razorpayOrder.setStatus("SUCCESS");
            razorpayOrderRepository.save(razorpayOrder);

            ParentWallet wallet = parentWalletRepository.findByParent(parent)
                    .orElseGet(() -> {
                        ParentWallet newWallet = new ParentWallet();
                        newWallet.setParent(parent);
                        newWallet.setBalance(0.0);
                        return newWallet;
                    });

            wallet.addBalance(amount);
            wallet.setLastTransactionId(transactionId);
            wallet.setNotes(notes != null ? notes : "Wallet Recharge");
            parentWalletRepository.save(wallet);

            return ResponseEntity.ok(ApiResponse.ok("Balance added successfully", Map.of(
                    "newBalance", wallet.getBalance(),
                    "transactionId", transactionId,
                    "amount", amount
            )));
        } catch (Exception e) {
            e.printStackTrace(); // Log stack trace for diagnostic visibility
            throw new RuntimeException("Failed to verify and add wallet balance: " + e.getMessage(), e);
        }
    }

    /**
     * Pay fees for a child using wallet balance
     * Body: { "childId": 1, "feeId": 2 }
     */
    @Transactional
    @PostMapping("/wallet/pay-fee")
    public ResponseEntity<ApiResponse<Map<String, Object>>> payFeeWithWallet(@RequestBody Map<String, Long> body) {
        Parent parent = getAuthenticatedParent();
        Long childId = body.get("childId");
        Long feeId = body.get("feeId");

        // Verify child is linked to parent
        Student child = getVerifiedChild(parent, childId);

        // Get fee
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee not found"));

        if (!fee.getStudent().getId().equals(child.getId())) {
            throw new ResourceNotFoundException("This fee doesn't belong to this child");
        }

        // Get parent wallet
        ParentWallet wallet = parentWalletRepository.findByParent(parent)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        Double feeAmount = fee.getAmount().doubleValue();
        if (!wallet.hasSufficientBalance(feeAmount)) {
            throw new RuntimeException("Insufficient wallet balance. Required: ₹" + feeAmount + 
                                     ", Available: ₹" + wallet.getBalance());
        }

        // Deduct from wallet
        if (!wallet.deductBalance(feeAmount)) {
            throw new RuntimeException("Failed to deduct fee from wallet");
        }

        // Mark fee as paid
        fee.setStatus(Fee.FeeStatus.PAID);
        fee.setPaidDate(java.time.LocalDate.now());
        fee.setPaidAmount(fee.getAmount());
        feeRepository.save(fee);

        wallet.setNotes("Fee payment for child: " + child.getName());
        parentWalletRepository.save(wallet);

        return ResponseEntity.ok(ApiResponse.ok("Fee paid successfully using wallet", Map.of(
                "feeId", fee.getId(),
                "amount", feeAmount,
                "childName", child.getName(),
                "newBalance", wallet.getBalance()
        )));
    }

    /**
     * Get all pending fees for all children
     */
    @Transactional
    @GetMapping("/wallet/pending-fees")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingFees() {
        Parent parent = getAuthenticatedParent();
        List<Student> children = parentChildRepository.findByParent(parent)
                .stream()
                .map(ParentChild::getChild)
                .toList();

        List<Fee> pendingFees = children.stream()
                .flatMap(child -> feeRepository.findByStudent(child).stream()
                        .filter(f -> f.getStatus() == null || f.getStatus() != Fee.FeeStatus.PAID))
                .toList();

        Double totalDue = pendingFees.stream()
                .mapToDouble(f -> f.getAmount().doubleValue())
                .sum();

        Double walletBalance = parentWalletRepository.findByParent(parent)
                .map(ParentWallet::getBalance)
                .orElse(0.0);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "pendingFees", pendingFees,
                "totalDue", totalDue,
                "walletBalance", walletBalance,
                "canPayAll", walletBalance >= totalDue
        )));
    }

    /**
     * Check if parent has sufficient balance for a specific fee
     */
    @Transactional
    @GetMapping("/wallet/check-balance/{feeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkBalanceForFee(@PathVariable Long feeId) {
        Parent parent = getAuthenticatedParent();
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee not found"));

        Double walletBalance = parentWalletRepository.findByParent(parent)
                .map(ParentWallet::getBalance)
                .orElse(0.0);

        double feeAmount = fee.getAmount().doubleValue();
        boolean canPay = walletBalance >= feeAmount;

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "feeAmount", feeAmount,
                "walletBalance", walletBalance,
                "canPay", canPay,
                "shortfall", Math.max(0, feeAmount - walletBalance)
        )));
    }

    @Transactional
    @GetMapping("/children/{childId}/assessments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getChildAssessments(
            @PathVariable Long childId) {
        Parent parent = getAuthenticatedParent();
        Student child = getVerifiedChild(parent, childId);

        List<AssessmentAttempt> attempts = assessmentAttemptRepository.findByStudent(child);
        List<Map<String, Object>> result = attempts.stream().map(att -> {
            Map<String, Object> m = new HashMap<>();
            Assessment a = att.getAssessment();
            m.put("assessmentId", a.getId());
            m.put("assessmentTitle", a.getTitle());
            m.put("assessmentType", a.getAssessmentType());
            m.put("totalMarks", a.getTotalMarks());
            m.put("passMarks", a.getPassMarks());
            m.put("startedAt", att.getStartedAt() != null ? att.getStartedAt().toString() : null);
            m.put("submittedAt", att.getSubmittedAt() != null ? att.getSubmittedAt().toString() : null);
            m.put("status", att.getStatus());

            if (a.isShowResultImmediately() || att.isResultsPublished()) {
                m.put("totalScore", att.getTotalScore());
                m.put("feedback", att.getFeedback());
                m.put("gradedAt", att.getGradedAt() != null ? att.getGradedAt().toString() : null);
            }
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Transactional
    @GetMapping("/children/{childId}/dashboard-details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChildDashboardDetails(@PathVariable Long childId) {
        Parent parent = getAuthenticatedParent();
        Student child = getVerifiedChild(parent, childId);

        // 1. Child Details
        Map<String, Object> childInfo = new HashMap<>();
        childInfo.put("id", child.getId());
        childInfo.put("userId", child.getUserId());
        childInfo.put("name", child.getName());
        childInfo.put("email", child.getEmail());
        childInfo.put("phone", child.getPhone());
        childInfo.put("address", child.getAddress());
        childInfo.put("department", child.getDepartment());
        childInfo.put("active", child.isActive());

        // 2. Enrolled Batches
        List<Batch> batches = batchRepository.findByStudentId(child.getId());
        List<Map<String, Object>> batchesData = new ArrayList<>();
        Set<Long> batchIds = new HashSet<>();
        Set<Course> studentCourses = new LinkedHashSet<>();

        for (Batch b : batches) {
            batchIds.add(b.getId());
            Map<String, Object> bm = new HashMap<>();
            bm.put("id", b.getId());
            bm.put("name", b.getName());
            bm.put("department", b.getDepartment());
            bm.put("startDate", b.getStartDate() != null ? b.getStartDate().toString() : null);
            bm.put("endDate", b.getEndDate() != null ? b.getEndDate().toString() : null);
            bm.put("status", b.getStatus() != null ? b.getStatus().name() : "UPCOMING");
            batchesData.add(bm);

            if (b.getCourses() != null) {
                studentCourses.addAll(b.getCourses());
            }
            if (b.getCourse() != null) {
                studentCourses.add(b.getCourse());
            }
        }

        // Add direct courses
        studentCourses.addAll(courseRepository.findDirectlyEnrolledByStudentId(child.getId()));

        // Format Course Details
        List<Map<String, Object>> coursesData = new ArrayList<>();
        Set<Long> courseIds = new HashSet<>();
        for (Course c : studentCourses) {
            courseIds.add(c.getId());
            Map<String, Object> cm = new HashMap<>();
            cm.put("id", c.getId());
            cm.put("title", c.getTitle());
            cm.put("description", c.getDescription());
            cm.put("department", c.getDepartment());
            cm.put("durationHours", c.getDurationHours());
            cm.put("status", c.getStatus() != null ? c.getStatus().name() : "DRAFT");
            cm.put("teacherName", c.getTeacher() != null ? c.getTeacher().getName() : "Unassigned");
            coursesData.add(cm);
        }

        // 3. Attendance Records & Analysis
        List<Attendance> records = attendanceRepository.findByStudentId(child.getId());
        List<Map<String, Object>> attendanceRecordsData = new ArrayList<>();
        
        long presentCount = 0;
        long absentCount = 0;
        long lateCount = 0;
        
        // Group by course to calculate course metrics
        Map<Long, Map<String, Object>> courseMetricsMap = new HashMap<>();
        for (Course c : studentCourses) {
            Map<String, Object> metric = new HashMap<>();
            metric.put("courseId", c.getId());
            metric.put("courseTitle", c.getTitle());
            metric.put("present", 0L);
            metric.put("total", 0L);
            metric.put("percentage", 0.0);
            courseMetricsMap.put(c.getId(), metric);
        }

        // Sort records by date for timeline
        List<Attendance> sortedRecords = records.stream()
                .sorted(Comparator.comparing(Attendance::getDate))
                .toList();

        List<Map<String, Object>> timelineData = new ArrayList<>();
        double cumulativePresent = 0;
        double cumulativeTotal = 0;

        for (Attendance r : sortedRecords) {
            Map<String, Object> rm = new HashMap<>();
            rm.put("id", r.getId());
            rm.put("courseId", r.getCourse().getId());
            rm.put("courseTitle", r.getCourse().getTitle());
            rm.put("date", r.getDate().toString());
            rm.put("status", r.getStatus().name());
            rm.put("remarks", r.getRemarks());
            attendanceRecordsData.add(rm);

            // overall counts
            if (r.getStatus() == Attendance.AttendanceStatus.PRESENT) {
                presentCount++;
                cumulativePresent++;
            } else if (r.getStatus() == Attendance.AttendanceStatus.LATE) {
                lateCount++;
                cumulativePresent += 0.5; // Late counts as half presence
            } else if (r.getStatus() == Attendance.AttendanceStatus.ABSENT) {
                absentCount++;
            }
            cumulativeTotal++;

            double runningRate = cumulativeTotal > 0 ? (cumulativePresent * 100.0 / cumulativeTotal) : 0.0;
            
            // timeline point
            Map<String, Object> tlPoint = new HashMap<>();
            tlPoint.put("date", r.getDate().toString());
            tlPoint.put("status", r.getStatus().name());
            tlPoint.put("course", r.getCourse().getTitle());
            tlPoint.put("runningRate", Math.round(runningRate * 10.0) / 10.0);
            // map status to numerical value for line graph (Present=100, Late=50, Absent=0)
            int statusValue = r.getStatus() == Attendance.AttendanceStatus.PRESENT ? 100 : r.getStatus() == Attendance.AttendanceStatus.LATE ? 50 : 0;
            tlPoint.put("statusValue", statusValue);
            timelineData.add(tlPoint);

            // update course metrics
            Map<String, Object> metric = courseMetricsMap.get(r.getCourse().getId());
            if (metric == null) {
                metric = new HashMap<>();
                metric.put("courseId", r.getCourse().getId());
                metric.put("courseTitle", r.getCourse().getTitle());
                metric.put("present", 0L);
                metric.put("total", 0L);
                metric.put("percentage", 0.0);
                courseMetricsMap.put(r.getCourse().getId(), metric);
            }
            long cTotal = (long) metric.get("total") + 1;
            long cPresent = (long) metric.get("present");
            if (r.getStatus() == Attendance.AttendanceStatus.PRESENT) {
                cPresent++;
            } else if (r.getStatus() == Attendance.AttendanceStatus.LATE) {
                cPresent++; // count late in present baseline
            }
            metric.put("total", cTotal);
            metric.put("present", cPresent);
            double cPct = cTotal > 0 ? (cPresent * 100.0 / cTotal) : 0.0;
            metric.put("percentage", Math.round(cPct * 10.0) / 10.0);
        }

        Map<String, Object> attendanceSummary = new HashMap<>();
        attendanceSummary.put("total", records.size());
        attendanceSummary.put("present", presentCount);
        attendanceSummary.put("absent", absentCount);
        attendanceSummary.put("late", lateCount);
        double overallPercentage = records.size() > 0 ? ((presentCount + lateCount) * 100.0 / records.size()) : 0.0;
        attendanceSummary.put("percentage", Math.round(overallPercentage * 10.0) / 10.0);

        Map<String, Object> attendanceData = new HashMap<>();
        attendanceData.put("records", attendanceRecordsData);
        attendanceData.put("summary", attendanceSummary);
        attendanceData.put("courseMetrics", new ArrayList<>(courseMetricsMap.values()));
        attendanceData.put("timeline", timelineData);

        // 4. Exam Results & Performance Analysis
        List<ExamResult> examResults = examResultRepository.findByStudentId(child.getId());
        List<Map<String, Object>> gradesData = new ArrayList<>();
        double totalScorePct = 0;
        int gradedCount = 0;

        for (ExamResult er : examResults) {
            Exam exam = er.getExam();
            if (exam != null) {
                Map<String, Object> gm = new HashMap<>();
                gm.put("id", er.getId());
                gm.put("examId", exam.getId());
                gm.put("examTitle", exam.getTitle());
                gm.put("examType", exam.getExamType().name());
                gm.put("scheduledAt", exam.getScheduledAt() != null ? exam.getScheduledAt().toString() : null);
                gm.put("courseId", exam.getCourse() != null ? exam.getCourse().getId() : null);
                gm.put("courseTitle", exam.getCourse() != null ? exam.getCourse().getTitle() : exam.getBatchName());
                gm.put("marksObtained", er.getMarksObtained());
                gm.put("maxMarks", exam.getMaxMarks());
                gm.put("passMarks", exam.getPassMarks());
                gm.put("grade", er.getGrade());
                gm.put("attended", er.isAttended());
                gm.put("cleared", er.isCleared());
                gm.put("gradedAt", er.getGradedAt() != null ? er.getGradedAt().toString() : null);
                gradesData.add(gm);

                if (er.getMarksObtained() != null && exam.getMaxMarks() != null && exam.getMaxMarks() > 0) {
                    double pct = er.getMarksObtained() * 100.0 / exam.getMaxMarks();
                    totalScorePct += pct;
                    gradedCount++;
                }
            }
        }

        Map<String, Object> gradeAnalysis = new HashMap<>();
        gradeAnalysis.put("results", gradesData);
        gradeAnalysis.put("averagePercentage", gradedCount > 0 ? Math.round((totalScorePct / gradedCount) * 10.0) / 10.0 : 0.0);
        gradeAnalysis.put("totalExams", examResults.size());
        gradeAnalysis.put("passedExams", examResults.stream().filter(ExamResult::isCleared).count());

        // 5. Current & Future 3 Exams
        LocalDateTime now = LocalDateTime.now();
        List<Exam> allExams = examRepository.findAll().stream()
                .filter(e -> {
                    boolean courseMatch = e.getCourse() != null && courseIds.contains(e.getCourse().getId());
                    boolean batchMatch = e.getBatchId() != null && batchIds.contains(e.getBatchId());
                    return courseMatch || batchMatch;
                })
                .collect(Collectors.toList());

        // Add custom student exams
        List<ExamStudent> customStudentExams = examStudentRepository.findByStudentId(child.getId());
        for (ExamStudent es : customStudentExams) {
            if (es.getExam() != null && !es.isUnrecommended()) {
                allExams.add(es.getExam());
            }
        }

        // Deduplicate
        Map<Long, Exam> examMap = new HashMap<>();
        for (Exam e : allExams) {
            examMap.put(e.getId(), e);
        }
        allExams = new ArrayList<>(examMap.values());
        
        List<Map<String, Object>> currentExams = new ArrayList<>();
        List<Map<String, Object>> upcomingExams = new ArrayList<>();

        for (Exam e : allExams) {
            Map<String, Object> em = new HashMap<>();
            em.put("id", e.getId());
            em.put("title", e.getTitle());
            em.put("examType", e.getExamType().name());
            em.put("courseTitle", e.getCourse() != null ? e.getCourse().getTitle() : e.getBatchName());
            em.put("scheduledAt", e.getScheduledAt() != null ? e.getScheduledAt().toString() : null);
            em.put("durationMinutes", e.getDurationMinutes());
            em.put("maxMarks", e.getMaxMarks());
            em.put("passMarks", e.getPassMarks());
            em.put("status", e.getStatus().name());

            int duration = e.getDurationMinutes() != null ? e.getDurationMinutes() : 60;
            LocalDateTime examEnd = e.getScheduledAt() != null ? e.getScheduledAt().plusMinutes(duration) : now;

            boolean isCurrent = e.getStatus() == Exam.ExamStatus.CURRENT || 
                               (e.getScheduledAt() != null && e.getScheduledAt().isBefore(now) && examEnd.isAfter(now));
            
            boolean isUpcoming = (e.getStatus() == Exam.ExamStatus.UPCOMING || 
                                 e.getStatus() == Exam.ExamStatus.POSTPONED || 
                                 e.getStatus() == Exam.ExamStatus.RESCHEDULED) && 
                                 e.getScheduledAt() != null && e.getScheduledAt().isAfter(now);

            if (isCurrent) {
                currentExams.add(em);
            } else if (isUpcoming) {
                upcomingExams.add(em);
            }
        }

        List<Map<String, Object>> limitedUpcoming = upcomingExams.stream()
                .sorted(Comparator.comparing(e -> LocalDateTime.parse((String) e.get("scheduledAt"))))
                .limit(3)
                .toList();

        // 6. Scatter Plot Data: Correlation between attendance rate and exam grades by course
        List<Map<String, Object>> correlationData = new ArrayList<>();
        for (Course c : studentCourses) {
            Map<String, Object> attMetric = courseMetricsMap.get(c.getId());
            double attPct = attMetric != null ? (double) attMetric.get("percentage") : 0.0;
            
            double courseScoreSum = 0;
            int courseExamCount = 0;
            for (ExamResult er : examResults) {
                Exam exam = er.getExam();
                if (exam != null && exam.getCourse() != null && exam.getCourse().getId().equals(c.getId())) {
                    if (er.getMarksObtained() != null && exam.getMaxMarks() != null && exam.getMaxMarks() > 0) {
                        courseScoreSum += er.getMarksObtained() * 100.0 / exam.getMaxMarks();
                        courseExamCount++;
                    }
                }
            }
            
            if (courseExamCount > 0) {
                double avgGrade = Math.round((courseScoreSum / courseExamCount) * 10.0) / 10.0;
                Map<String, Object> point = new HashMap<>();
                point.put("course", c.getTitle());
                point.put("attendance", attPct);
                point.put("grade", avgGrade);
                correlationData.add(point);
            }
        }
        attendanceData.put("correlation", correlationData);

        Map<String, Object> response = new HashMap<>();
        response.put("child", childInfo);
        response.put("batches", batchesData);
        response.put("courses", coursesData);
        response.put("attendance", attendanceData);
        response.put("grades", gradeAnalysis);
        response.put("currentExams", currentExams);
        response.put("upcomingExams", limitedUpcoming);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
