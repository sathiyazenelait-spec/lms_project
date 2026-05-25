package com.zenelait.lms.controller;

import com.zenelait.lms.dto.request.AttendanceDTO;
import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.service.mail.EmailService;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.file.attribute.UserPrincipal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

	private final StudentRepository studentRepository;
	private final CourseRepository courseRepository;
	private final AssignmentRepository assignmentRepository;
	private final AssignmentSubmissionRepository submissionRepository;
	private final AttendanceRepository attendanceRepository;
	private final FeeRepository feeRepository;
	private final NotificationRepository notificationRepository;
	private final AnnouncementRepository announcementRepository;
	private final BatchRepository batchRepository;
	private final EmailService emailService;
	private final ParentChildRepository parentChildRepository;
	private final AttendanceRepository attendanceRepo;
	private final ExamRepository examRepository;
	private final ExamResultRepository examResultRepository;
	private final TeacherReviewRepository teacherReviewRepository;
	private final TeacherRepository teacherRepository;
	private final CertificateRepository certificateRepository;
	private final CourseEnrollmentRequestRepository courseEnrollmentRequestRepository;

	private final AssessmentRepository assessmentRepository;
	private final AssessmentQuestionRepository assessmentQuestionRepository;
	private final AssessmentAttemptRepository assessmentAttemptRepository;
	private final AssessmentAnswerRepository assessmentAnswerRepository;
	private final AdminRepository adminRepository;

	@GetMapping("/profile")
	public ResponseEntity<ApiResponse<Student>> getProfile(@AuthenticationPrincipal Student student) {
		return ResponseEntity.ok(ApiResponse.ok(student));
	}

	@PutMapping("/profile")
	public ResponseEntity<ApiResponse<Student>> updateProfile(@AuthenticationPrincipal Student student,
			@RequestBody Map<String, String> body) {
		if (body.containsKey("name"))
			student.setName(body.get("name"));
		if (body.containsKey("phone"))
			student.setPhone(body.get("phone"));
		if (body.containsKey("address"))
			student.setAddress(body.get("address"));
		if (body.containsKey("department"))
			student.setDepartment(body.get("department"));
		if (body.containsKey("profilePicUrl"))
			student.setProfilePicUrl(body.get("profilePicUrl"));
		studentRepository.save(student);
		return ResponseEntity.ok(ApiResponse.ok("Profile updated", student));
	}

	// ── Batches ───────────────────────────────────────────────────────
	// ── Courses ───────────────────────────────────────────────────────
	// ── Batches the student is enrolled in (with their courses) ─────────────────
	@Transactional
	@GetMapping("/batches")
	public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyBatches(
			@AuthenticationPrincipal Student student) {
		System.out.println("[DEBUG-BATCHES] Fetching batches for student ID: " + student.getId() + ", Email: " + student.getEmail());
		List<Batch> foundBatches = batchRepository.findByStudentId(student.getId());
		System.out.println("[DEBUG-BATCHES] Found batch count: " + foundBatches.size());
		List<Map<String, Object>> result = foundBatches.stream()
				.sorted(Comparator.comparing(Batch::getStartDate).reversed()).map(b -> {
					Map<String, Object> m = new java.util.LinkedHashMap<>();
					m.put("id", b.getId());
					m.put("name", b.getName());
					m.put("department", b.getDepartment());
					m.put("startDate", b.getStartDate() != null ? b.getStartDate().toString() : null);
					m.put("endDate", b.getEndDate() != null ? b.getEndDate().toString() : null);
					m.put("status", b.getStatus() != null ? b.getStatus().name() : "UPCOMING");

					// ── ALL courses in this batch (subjects) ──────────────────
					// Priority: batch_courses many-to-many (new), fallback: legacy course_id
					java.util.Set<Course> batchCourses = new java.util.LinkedHashSet<>();
					if (b.getCourses() != null && !b.getCourses().isEmpty()) {
						batchCourses.addAll(b.getCourses());
					} else if (b.getCourse() != null) {
						// legacy single-course FK
						batchCourses.add(b.getCourse());
					}

					List<Map<String, Object>> courseList = batchCourses.stream()
							.filter(c -> c.getStatus() != Course.CourseStatus.INACTIVE).map(bc -> {
								Map<String, Object> cm = new java.util.LinkedHashMap<>();
								cm.put("id", bc.getId());
								cm.put("title", bc.getTitle());
								cm.put("description", bc.getDescription());
								cm.put("department", bc.getDepartment());
								cm.put("durationHours", bc.getDurationHours());
								cm.put("status", bc.getStatus() != null ? bc.getStatus().name() : "DRAFT");
								cm.put("teacherName",
										bc.getTeacher() != null ? bc.getTeacher().getName() : "Unassigned");
								return cm;
							}).collect(java.util.stream.Collectors.toList());
					m.put("courses", courseList); // list of all subjects
					m.put("courseCount", courseList.size());
					return m;
				}).collect(java.util.stream.Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok(result));
	}

	// ── Direct-enrolled courses only (batch courses come via /student/batches) ─
	@Transactional
	@GetMapping("/courses")
	public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyCourses(
			@AuthenticationPrincipal Student student) {

		// Helper to convert Course → safe map (no lazy proxy issues)
		java.util.function.Function<Course, Map<String, Object>> toMap = c -> {
			Map<String, Object> m = new java.util.LinkedHashMap<>();
			m.put("id", c.getId());
			m.put("title", c.getTitle());
			m.put("description", c.getDescription());
			m.put("department", c.getDepartment());
			m.put("durationHours", c.getDurationHours());
			m.put("status", c.getStatus() != null ? c.getStatus().name() : "DRAFT");
			if (c.getTeacher() != null) {
				try {
					Map<String, Object> t = new java.util.LinkedHashMap<>();
					t.put("id", c.getTeacher().getId());
					t.put("name", c.getTeacher().getName());
					m.put("teacher", t);
				} catch (Exception e) {
					m.put("teacher", null);
				}
			} else {
				m.put("teacher", null);
			}
			return m;
		};

		// ONLY direct enrollments from student_courses table (native query — reliable)
		List<Map<String, Object>> result = courseRepository.findDirectlyEnrolledByStudentId(student.getId()).stream()
				.filter(c -> c.getStatus() == null || c.getStatus() != Course.CourseStatus.INACTIVE).map(toMap)
				.collect(java.util.stream.Collectors.toList());

		return ResponseEntity.ok(ApiResponse.ok(result));
	}
	
	
	@GetMapping("/courses/{courseId}/students")
	public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCourseStudents(
	        @PathVariable Long courseId) {

	    List<Object[]> rows = studentRepository.findAllStudentsInCourse(courseId);

	    List<Map<String, Object>> result = rows.stream().map(r -> {
	        Map<String, Object> m = new HashMap<>();
	        m.put("id", r[0]);
	        m.put("name", r[1]);
	        m.put("email", r[2]);
	        m.put("profilePicUrl", r[3]);
	        return m;
	    }).toList();

	    return ResponseEntity.ok(ApiResponse.ok(result));
	}

	@PostMapping("/enroll/{courseId}")
	@Transactional
	public ResponseEntity<ApiResponse<String>> enrollCourse(
	        @PathVariable Long courseId,
	        @AuthenticationPrincipal Student student) {

	    Course course = courseRepository.findById(courseId)
	            .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

	    boolean exists = courseRepository.existsStudentEnrollment(student.getId(), courseId) > 0;
	    boolean existsInBatch = batchRepository.existsStudentInCourse(student.getId(), courseId) > 0;

	    // ✅ SINGLE CHECK
	    if (exists || existsInBatch) {
	        return ResponseEntity.ok(ApiResponse.ok("Already enrolled"));
	    }

	    try {
	        courseRepository.enrollStudent(student.getId(), courseId);
	    } catch (Exception e) {
	        return ResponseEntity.ok(ApiResponse.ok("Already enrolled"));
	    }

	    sendEnrollmentNotifications(student, course);

	    return ResponseEntity.ok(ApiResponse.ok("Enrolled successfully"));
	}

	private void sendEnrollmentNotifications(Student student, Course course) {

		String title = "📘 Course Enrollment";
		String message = student.getName() + " enrolled in " + course.getTitle();

		// Resolve Super Admin for Student's Organization to use as dynamic From address
		String senderName = "ZenelaitLMS System";
		String senderEmail = null;
		if (student.getOrganizationId() != null) {
			List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(student.getOrganizationId());
			if (!superAdmins.isEmpty()) {
				Admin sa = superAdmins.get(0);
				senderName = sa.getName();
				senderEmail = sa.getEmail();
			}
		}

		// 👨‍🏫 Teacher
		if (course.getTeacher() != null) {
			String email = course.getTeacher().getEmail();

			notificationRepository.save(Notification.builder().recipientEmail(email).title(title).message(message)
					.type(Notification.NotificationType.INFO).read(false).build());

			emailService.send(email, title, message, senderName, senderEmail);
		}

		// 👨‍👩‍👧 Parents
		final String finalSenderName = senderName;
		final String finalSenderEmail = senderEmail;
		parentChildRepository.findByChild(student).forEach(pc -> {
			String email = pc.getParent().getEmail();

			notificationRepository.save(Notification.builder().recipientEmail(email).title(title).message(message)
					.type(Notification.NotificationType.INFO).read(false).build());

			emailService.send(email, title, message, finalSenderName, finalSenderEmail);
		});

		// 🏢 Admin
		emailService.send("admin@zenelait.com", title, message, senderName, senderEmail);
	}

	@Transactional
	@GetMapping("/assignments")
	public ResponseEntity<ApiResponse<List<Assignment>>> getMyAssignments(
			@RequestParam(required = false) Long courseId) {
		List<Assignment> assignments;
		if (courseId != null) {
			Course course = courseRepository.findById(courseId)
					.orElseThrow(() -> new ResourceNotFoundException("Course not found"));
			assignments = assignmentRepository.findByCourse(course);
		} else {
			assignments = assignmentRepository.findAll();
		}
		return ResponseEntity.ok(ApiResponse.ok(assignments));
	}

	@PostMapping("/assignments/{id}/submit")
	@Transactional
	public ResponseEntity<ApiResponse<AssignmentSubmission>> submitAssignment(@PathVariable Long id,
			@AuthenticationPrincipal Student student, @RequestBody Map<String, String> body) {
		Assignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + id));

		java.util.Optional<AssignmentSubmission> existingSub = submissionRepository.findByAssignmentAndStudent(assignment, student);

		AssignmentSubmission sub;
		if (existingSub.isPresent()) {
			sub = existingSub.get();
			if (sub.getStatus() != AssignmentSubmission.SubmissionStatus.RESUBMISSION_REQUESTED) {
				throw new BadRequestException("You have already submitted this assignment and no resubmission was requested.");
			}
		} else {
			sub = AssignmentSubmission.builder().assignment(assignment).student(student).build();
		}

		sub.setContent(body.get("content"));
		sub.setFileUrl(body.get("fileUrl"));
		sub.setExternalLink(body.get("externalLink"));
		sub.setStudentNote(body.get("studentNote"));
		sub.setSubmittedAt(LocalDateTime.now());

		AssignmentSubmission.SubmissionStatus status = AssignmentSubmission.SubmissionStatus.SUBMITTED;
		if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate())) {
			if (!assignment.isAllowLate()) {
				throw new BadRequestException("Late submission is not allowed for this assignment.");
			}
			if (assignment.getLateDeadline() != null && LocalDateTime.now().isAfter(assignment.getLateDeadline())) {
				throw new BadRequestException("Late deadline has passed. Submission rejected.");
			}
			status = AssignmentSubmission.SubmissionStatus.LATE;
		}
		sub.setStatus(status);

		submissionRepository.save(sub);
		return ResponseEntity.ok(ApiResponse.ok("Assignment submitted successfully", sub));
	}

	@GetMapping("/submissions")
	public ResponseEntity<ApiResponse<List<AssignmentSubmission>>> getMySubmissions(
			@AuthenticationPrincipal Student student) {
		return ResponseEntity.ok(ApiResponse.ok(submissionRepository.findByStudent(student)));
	}

	@GetMapping("/attendance")
	public ResponseEntity<ApiResponse<Map<String, Object>>> getAttendance(@AuthenticationPrincipal Student student,
			@RequestParam Long courseId) {
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new ResourceNotFoundException("Course not found"));
		List<Attendance> records = attendanceRepository.findByStudentAndCourse(student, course);
		long present = attendanceRepository.countPresentByStudentAndCourse(student, course);
		long total = attendanceRepository.countTotalByStudentAndCourse(student, course);
		double pct = total > 0 ? (present * 100.0 / total) : 0;
		return ResponseEntity.ok(ApiResponse.ok(Map.of("records", records, "present", present, "total", total,
				"percentage", String.format("%.1f", pct))));
	}

	@Transactional
	@GetMapping("/fees")
	public ResponseEntity<ApiResponse<List<Fee>>> getMyFees(@AuthenticationPrincipal Student student) {
		return ResponseEntity.ok(ApiResponse.ok(feeRepository.findByStudent(student)));
	}

	@GetMapping("/notifications")
	public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(@AuthenticationPrincipal Student student) {
		return ResponseEntity.ok(
				ApiResponse.ok(notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(student.getEmail())));
	}
	
	
	@Transactional
	@GetMapping("/performance")
	public ResponseEntity<?> getPerformance() {
		org.springframework.security.core.Authentication auth = 
				org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || !auth.isAuthenticated()) {
			return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
		}
		Object principal = auth.getPrincipal();
		final String email;
		if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
			email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
		} else if (principal instanceof String) {
			email = (String) principal;
		} else {
			return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
		}
		if (email == null) {
			return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
		}
		Student student = studentRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("Student not found for email: " + email));

	    try {
	        List<Attendance> attendance = attendanceRepo.findByStudentId(student.getId());
	        List<AttendanceDTO> dto = attendance.stream()
	            .map(a -> new AttendanceDTO(
	                a.getId(),
	                a.getCourse().getTitle(),
	                a.getDate(),
	                a.getStatus().name(),
	                a.getRemarks()
	            ))
	            .toList();

	        java.util.Set<Course> studentCourses = new java.util.HashSet<>();
	        
	        // 1. Direct courses
	        studentCourses.addAll(courseRepository.findDirectlyEnrolledByStudentId(student.getId()));
	        
	        // 2. Batch courses
	        List<Batch> studentBatches = batchRepository.findAll().stream()
	                .filter(b -> b.getStudents().stream().anyMatch(s -> s.getId().equals(student.getId())))
	                .toList();
	        for (Batch b : studentBatches) {
	            if (b.getCourses() != null) {
	                studentCourses.addAll(b.getCourses());
	            }
	            if (b.getCourse() != null) {
	                studentCourses.add(b.getCourse());
	            }
	        }

	        List<Map<String, Object>> tasks = new java.util.ArrayList<>();
	        List<Map<String, Object>> grades = new java.util.ArrayList<>();

	        for (Course course : studentCourses) {
	            List<Assignment> assignments = assignmentRepository.findByCourse(course);
	            for (Assignment assignment : assignments) {
	                // Find submission
	                java.util.Optional<AssignmentSubmission> subOpt = submissionRepository.findByAssignmentAndStudent(assignment, student);
	                
	                String status = "PENDING";
	                String gradeStr = "N/A";
	                
	                if (subOpt.isPresent()) {
	                    AssignmentSubmission submission = subOpt.get();
	                    if (submission.getMarksObtained() != null || submission.getGrade() != null) {
	                        status = "GRADED";
	                        String marks = submission.getMarksObtained() != null ? submission.getMarksObtained().toString() : "—";
                        String max = assignment.getMaxMarks() > 0 ? String.valueOf(assignment.getMaxMarks()) : "100";
	                        gradeStr = marks + " / " + max;
	                        if (submission.getGrade() != null) {
	                            gradeStr += " (" + submission.getGrade() + ")";
	                        }
	                        
	                        // Add to grades
	                        Map<String, Object> gMap = new java.util.HashMap<>();
	                        gMap.put("id", "grade_" + submission.getId());
	                        gMap.put("course", course.getTitle());
	                        gMap.put("assignment", assignment.getTitle());
	                        gMap.put("grade", gradeStr);
	                        grades.add(gMap);
	                    } else {
	                        status = "SUBMITTED";
	                    }
	                } else {
	                    if (assignment.getDueDate() != null && assignment.getDueDate().isBefore(LocalDateTime.now())) {
	                        status = "OVERDUE";
	                    }
	                }
	                
	                // Add to tasks
	                Map<String, Object> tMap = new java.util.HashMap<>();
	                tMap.put("id", assignment.getId());
	                tMap.put("title", assignment.getTitle());
	                tMap.put("status", status);
	                tMap.put("dueDate", assignment.getDueDate() != null ? assignment.getDueDate().toString() : "No Due Date");
	                tasks.add(tMap);
	            }
	        }

	        // Fetch graded exam results
	        List<ExamResult> examResults = examResultRepository.findByStudentId(student.getId());
	        for (ExamResult result : examResults) {
	            Exam exam = result.getExam();
	            if (exam != null) {
	                String courseName = "General / Batch";
	                if (exam.getCourse() != null) {
	                    courseName = exam.getCourse().getTitle();
	                } else if (exam.getBatchName() != null) {
	                    courseName = exam.getBatchName();
	                }
	                
	                String marks = result.getMarksObtained() != null ? result.getMarksObtained().toString() : "—";
	                String max = exam.getMaxMarks() != null ? exam.getMaxMarks().toString() : "100";
	                String gradeStr = marks + " / " + max;
	                if (result.getGrade() != null) {
	                    gradeStr += " (" + result.getGrade() + ")";
	                }
	                
	                Map<String, Object> gMap = new java.util.HashMap<>();
	                gMap.put("id", "exam_" + result.getId());
	                gMap.put("course", courseName);
	                gMap.put("assignment", exam.getTitle() + " (Exam)");
	                gMap.put("grade", gradeStr);
	                grades.add(gMap);
	            }
	        }

	        Map<String, Object> response = new HashMap<>();
	        response.put("attendance", dto);
	        response.put("tasks", tasks);
	        response.put("grades", grades);

	        return ResponseEntity.ok(response);
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(500).body(Map.of(
	            "error", "Failed to fetch performance",
	            "message", e.getMessage()
	        ));
	    }
	}

	@PatchMapping("/notifications/{id}/read")
	public ResponseEntity<ApiResponse<Void>> markNotificationRead(@PathVariable Long id,
			@AuthenticationPrincipal Student student) {
		notificationRepository.findById(id).ifPresent(n -> {
			if (n.getRecipientEmail().equals(student.getEmail())) {
				n.setRead(true);
				notificationRepository.save(n);
			}
		});
		return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
	}

	@GetMapping("/announcements")
	public ResponseEntity<ApiResponse<List<Announcement>>> getAnnouncements(@AuthenticationPrincipal Student student) {
		Long orgId = student.getOrganizationId();
		if (orgId == null) {
			return ResponseEntity.ok(ApiResponse.ok(announcementRepository.findByRoleOrGlobal(Role.STUDENT)));
		}
		List<Long> enrolledCourseIds = courseRepository.findDirectlyEnrolledByStudentId(student.getId()).stream()
				.map(Course::getId).collect(Collectors.toList());
		if (enrolledCourseIds.isEmpty()) {
			return ResponseEntity.ok(ApiResponse.ok(announcementRepository.findByOrganizationIdAndRoleOrGlobal(orgId, Role.STUDENT)));
		} else {
			return ResponseEntity.ok(ApiResponse.ok(announcementRepository.findByOrganizationIdAndRoleOrGlobalOrCourseIds(orgId, Role.STUDENT, enrolledCourseIds)));
		}
	}

	@Transactional
	@PatchMapping("/notifications/read-all")
	public ResponseEntity<ApiResponse<Void>> markAllNotificationsRead(@AuthenticationPrincipal Student student) {
		notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(student.getEmail()).forEach(n -> {
			n.setRead(true);
			notificationRepository.save(n);
		});
		return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
	}
	
	// ── Learning Board: Available Courses (All, Enrolled, Unenrolled) ──────────────
		/**
		 * GET /api/student/courses/available
		 * Returns all courses with enrollment status: batch courses + direct enrollment courses
		 */
		@Transactional
		@GetMapping("/courses/available")
		public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAvailableCourses(
				@AuthenticationPrincipal Student student) {
			
			List<Map<String, Object>> result = new java.util.ArrayList<>();
			
			// Get all batch courses the student is in
			java.util.Set<Course> batchCourses = new java.util.HashSet<>();
			List<Batch> batches = batchRepository.findByStudentId(student.getId());
			for (Batch b : batches) {
				if (b.getCourses() != null) batchCourses.addAll(b.getCourses());
				if (b.getCourse() != null) batchCourses.add(b.getCourse());
			}
			
			// Get directly enrolled courses
			List<Course> directEnrolled = courseRepository.findDirectlyEnrolledByStudentId(student.getId());
			java.util.Set<Course> directEnrolledSet = new java.util.HashSet<>(directEnrolled);
			
			// Combine all courses
			java.util.Set<Course> allCourses = new java.util.HashSet<>(batchCourses);
			allCourses.addAll(directEnrolledSet);
			
			// Map to response
			for (Course course : allCourses) {
				if (course.getStatus() == Course.CourseStatus.INACTIVE) continue; // Skip inactive
				
				Map<String, Object> m = new java.util.LinkedHashMap<>();
				m.put("id", course.getId());
				m.put("title", course.getTitle());
				m.put("description", course.getDescription());
				m.put("department", course.getDepartment());
				m.put("durationHours", course.getDurationHours());
				m.put("status", course.getStatus() != null ? course.getStatus().name() : "DRAFT");
				m.put("enrollmentType", batchCourses.contains(course) ? "BATCH" : "DIRECT");
				
				// Teacher info
				if (course.getTeacher() != null) {
					Map<String, Object> t = new java.util.LinkedHashMap<>();
					t.put("id", course.getTeacher().getId());
					t.put("name", course.getTeacher().getName());
					t.put("email", course.getTeacher().getEmail());
					m.put("teacher", t);
				}
				
				result.add(m);
			}
			
			return ResponseEntity.ok(ApiResponse.ok(result));
		}

		/**
		 * GET /api/student/courses/{courseId}/details
		 * Returns detailed course info: completion status, teacher, classmates
		 */
		@Transactional
		@GetMapping("/courses/{courseId}/details")
		public ResponseEntity<ApiResponse<Map<String, Object>>> getCourseDetails(
		        @PathVariable Long courseId,
		        @AuthenticationPrincipal Student student) {

		    Course course = courseRepository.findById(courseId)
		            .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

		    // ✅ SAFE BOOLEAN HANDLING
		    boolean isDirectlyEnrolled =
		            courseRepository.existsStudentEnrollment(student.getId(), courseId) > 0;

		    boolean isInBatch =
		            batchRepository.existsStudentInCourse(student.getId(), courseId) > 0;
		            
		    List<Object[]> courseDurations = batchRepository.findBatchDatesByCourseId(courseId);
		    LocalDate today = LocalDate.now();

		    long totalDays = 0;
		    long completedDays = 0;

		    for (Object[] row : courseDurations) {
		        LocalDate startDate = (LocalDate) row[0];
		        LocalDate endDate   = (LocalDate) row[1];

		        // total duration of this batch
		        long batchTotalDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;

		        // completed days logic
		        long batchCompletedDays;

		        if (today.isBefore(startDate)) {
		            batchCompletedDays = 0; // not started
		        } else if (today.isAfter(endDate)) {
		            batchCompletedDays = batchTotalDays; // fully completed
		        } else {
		            batchCompletedDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, today) + 1;
		        }

		        // choose the most relevant batch (ACTIVE preferred)
		        if (today.isAfter(startDate) && today.isBefore(endDate)) {
		            totalDays = batchTotalDays;
		            completedDays = batchCompletedDays;
		            break; // ACTIVE batch found → stop
		        }

		        // fallback (if no active batch)
		        totalDays = batchTotalDays;
		        completedDays = batchCompletedDays;
		    }
		    
		    int completioncoursePercent = 0;

		    if (totalDays > 0) {
		        completioncoursePercent = (int) ((completedDays * 100) / totalDays);
		    } 
		    

//		    boolean isDirectlyEnrolled = Boolean.TRUE.equals(direct);
//		    boolean isInBatch          = Boolean.TRUE.equals(batch);

		    if (!isDirectlyEnrolled && !isInBatch) {
		        return ResponseEntity.status(403)
		                .body(ApiResponse.ok("Not enrolled in this course", null));
		    }

		    Map<String, Object> result = new LinkedHashMap<>();
		    result.put("id", course.getId());
		    result.put("title", course.getTitle());
		    result.put("description", course.getDescription());
		    result.put("department", course.getDepartment());
		    result.put("durationHours", course.getDurationHours());
		    result.put("status", course.getStatus() != null ? course.getStatus().name() : "DRAFT");
		    result.put("courseDurationDays", totalDays);
		    result.put("completedDays", completedDays);
		    result.put("completionPercentByDate", completioncoursePercent);

		    // ✅ Teacher info
		    if (course.getTeacher() != null) {
		        Map<String, Object> t = new LinkedHashMap<>();
		        t.put("id", course.getTeacher().getId());
		        t.put("name", course.getTeacher().getName());
		        t.put("email", course.getTeacher().getEmail());
		        result.put("teacher", t);
		    }

		    // ✅ Completion %
		    List<Assignment> assignments = assignmentRepository.findByCourse(course);

		    int completionPercent = 0;
		    if (!assignments.isEmpty()) {
		        long submittedCount = assignments.stream()
		                .filter(a -> submissionRepository.existsByAssignmentAndStudent(a, student))
		                .count();

		        completionPercent = (int) ((submittedCount * 100) / assignments.size());
		    }

		    result.put("completionStatus", completionPercent);

		    // ✅ Classmates
		    List<Object[]> studentRows = studentRepository.findAllStudentsInCourse(courseId);

		    List<Map<String, Object>> classmates = studentRows.stream()
		            .filter(r -> !((Long) r[0]).equals(student.getId()))
		            .map(r -> {
		                Map<String, Object> s = new LinkedHashMap<>();
		                s.put("id", r[0]);
		                s.put("name", r[1]);
		                s.put("email", r[2]);
		                s.put("profilePicUrl", r[3]);
		                return s;
		            }).toList();

		    result.put("classmates", classmates);
		    result.put("classmateCount", classmates.size());

		    result.put("enrollmentType", isDirectlyEnrolled ? "DIRECT" : "BATCH");

		    return ResponseEntity.ok(ApiResponse.ok(result));
		}
//		@Transactional
//		@GetMapping("/courses/{courseId}/details")
//		public ResponseEntity<ApiResponse<Map<String, Object>>> getCourseDetails(
//				@PathVariable Long courseId,
//				@AuthenticationPrincipal Student student) {
//			
//			Course course = courseRepository.findById(courseId)
//					.orElseThrow(() -> new ResourceNotFoundException("Course not found"));
//			
//			// Check if student is enrolled
//			boolean isDirectlyEnrolled = courseRepository.existsStudentEnrollment(student.getId(), courseId);
//			boolean isInBatch = batchRepository.existsStudentInCourse(student.getId(), courseId);
//			
//			if (!isDirectlyEnrolled && !isInBatch) {
//				return ResponseEntity.status(403).body(
//						ApiResponse.ok("Not enrolled in this course", null));
//			}
//			
//			Map<String, Object> result = new java.util.LinkedHashMap<>();
//			result.put("id", course.getId());
//			result.put("title", course.getTitle());
//			result.put("description", course.getDescription());
//			result.put("department", course.getDepartment());
//			result.put("durationHours", course.getDurationHours());
//			result.put("status", course.getStatus() != null ? course.getStatus().name() : "DRAFT");
//			
//			// Teacher info
//			if (course.getTeacher() != null) {
//				Map<String, Object> t = new java.util.LinkedHashMap<>();
//				t.put("id", course.getTeacher().getId());
//				t.put("name", course.getTeacher().getName());
//				t.put("email", course.getTeacher().getEmail());
//				result.put("teacher", t);
//			}
//			
//			// Course completion status (0-100%)
//			// For now, basic: based on assignment completion
//			List<Assignment> assignments = assignmentRepository.findByCourse(course);
//			int completionPercent = 0;
//			if (!assignments.isEmpty()) {
//				long submittedCount = assignments.stream()
//						.filter(a -> submissionRepository.existsByAssignmentAndStudent(a, student) )
//						.count();
//				completionPercent = (int) ((submittedCount * 100) / assignments.size());
//			}
//			result.put("completionStatus", completionPercent);
//			
//			// Classmates (all students in this course)
//			List<Object[]> studentRows = studentRepository.findAllStudentsInCourse(courseId);
//			List<Map<String, Object>> classmates = studentRows.stream()
//					.filter(r -> !((Long) r[0]).equals(student.getId())) // exclude self
//					.map(r -> {
//						Map<String, Object> s = new java.util.LinkedHashMap<>();
//						s.put("id", r[0]);
//						s.put("name", r[1]);
//						s.put("email", r[2]);
//						s.put("profilePicUrl", r[3]);
//						return s;
//					}).collect(java.util.stream.Collectors.toList());
//			result.put("classmates", classmates);
//			result.put("classmateCount", classmates.size());
//			result.put("enrollmentType", isDirectlyEnrolled ? "DIRECT" : "BATCH");
//			
//			return ResponseEntity.ok(ApiResponse.ok(result));
//		}
//
//		/**
//		 * POST /api/student/courses/{courseId}/unenroll
//		 * Unenroll student from a directly enrolled course
//		 */
		@Transactional
		@PostMapping("/courses/{courseId}/unenroll")
		public ResponseEntity<ApiResponse<String>> unenrollCourse(
				@PathVariable Long courseId,
				@AuthenticationPrincipal Student student) {
			
			Course course = courseRepository.findById(courseId)
					.orElseThrow(() -> new ResourceNotFoundException("Course not found"));
			
			boolean isDirectlyEnrolled = courseRepository.existsStudentEnrollment(student.getId(), courseId) > 0;
			boolean isInBatch = batchRepository.existsStudentInCourse(student.getId(), courseId) > 0;
			
			if (isInBatch) {
				return ResponseEntity.status(403).body(
						ApiResponse.ok("Cannot unenroll from batch courses. Remove from batch in admin panel.", null));
			}
			
			if (!isDirectlyEnrolled) {
				return ResponseEntity.ok(ApiResponse.ok("Not enrolled in this course"));
			}
			
			// Remove from direct enrollment
			Student fresh = studentRepository.findById(student.getId())
					.orElseThrow(() -> new RuntimeException("Student not found"));
			fresh.getEnrolledCourses().removeIf(c -> c.getId().equals(courseId));
			studentRepository.save(fresh);
			
			return ResponseEntity.ok(ApiResponse.ok("Unenrolled successfully"));
		}

		@PostMapping("/teachers/{teacherId}/reviews")
		@Transactional
		public ResponseEntity<ApiResponse<String>> submitTeacherReview(
				@PathVariable Long teacherId,
				@AuthenticationPrincipal Student student,
				@RequestBody Map<String, Object> body) {
			
			Teacher teacher = teacherRepository.findById(teacherId)
					.orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
			
			int rating = Integer.parseInt(body.get("rating").toString());
			if (rating < 1 || rating > 5) {
				return ResponseEntity.badRequest().body(ApiResponse.ok("Rating must be between 1 and 5", null));
			}
			
			String reviewText = (String) body.getOrDefault("reviewText", "");
			
			// Replace existing review from this student to update their feedback!
			List<TeacherReview> existing = teacherReviewRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId).stream()
					.filter(r -> r.getStudent().getId().equals(student.getId()))
					.toList();
			if (!existing.isEmpty()) {
				teacherReviewRepository.deleteAll(existing);
			}
			
			TeacherReview review = TeacherReview.builder()
					.student(student)
					.teacher(teacher)
					.rating(rating)
					.reviewText(reviewText)
					.build();
			
			teacherReviewRepository.save(review);
			
			return ResponseEntity.ok(ApiResponse.ok("Review submitted successfully"));
		}

		@GetMapping("/certificates")
		@Transactional
		public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudentCertificates() {
			org.springframework.security.core.Authentication auth = 
					org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
			if (auth == null || !auth.isAuthenticated()) {
				return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
			}
			Object principal = auth.getPrincipal();
			final String email;
			if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
				email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
			} else if (principal instanceof String) {
				email = (String) principal;
			} else {
				return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
			}
			if (email == null) {
				return ResponseEntity.status(401).body(ApiResponse.ok("Unauthorized", null));
			}
			Student student = studentRepository.findByEmail(email)
					.orElseThrow(() -> new ResourceNotFoundException("Student not found for email: " + email));
			
			List<Certificate> certs = certificateRepository.findByStudentIdOrderByIssueDateDesc(student.getId());
			
			List<Map<String, Object>> result = certs.stream()
					.map(c -> {
						Map<String, Object> m = new HashMap<>();
						m.put("id", c.getId());
						m.put("certificateNumber", c.getCertificateNumber());
						m.put("courseTitle", c.getCourse() != null ? c.getCourse().getTitle() : "—");
						m.put("teacherName", c.getTeacher() != null ? c.getTeacher().getName() : "Unknown");
						m.put("grade", c.getGrade());
						m.put("remarks", c.getRemarks());
						m.put("issueDate", c.getIssueDate().toString());
						return m;
					})
					.collect(Collectors.toList());
			
			return ResponseEntity.ok(ApiResponse.ok(result));
		}

		// ── Student Course Enrollment Requests ───────────────────────────
		@PostMapping("/enrollment-requests/request")
		@Transactional
		public ResponseEntity<ApiResponse<Map<String, Object>>> requestEnrollment(
				@AuthenticationPrincipal Student student,
				@RequestBody Map<String, Object> body) {
			
			Long courseId = Long.valueOf(body.get("courseId").toString());
			Course course = courseRepository.findById(courseId)
					.orElseThrow(() -> new ResourceNotFoundException("Course not found"));

			// Check if already pending or approved
			boolean existsPending = courseEnrollmentRequestRepository.existsByStudentIdAndCourseIdAndStatus(
					student.getId(), courseId, CourseEnrollmentRequest.EnrollmentRequestStatus.PENDING);
			if (existsPending) {
				return ResponseEntity.badRequest().body(ApiResponse.ok("Enrollment request is already pending", null));
			}

			Long count = courseRepository.existsStudentEnrollment(student.getId(), courseId);
			if (count != null && count > 0) {
				return ResponseEntity.badRequest().body(ApiResponse.ok("You are already enrolled in this course", null));
			}

			CourseEnrollmentRequest request = CourseEnrollmentRequest.builder()
					.student(student)
					.course(course)
					.status(CourseEnrollmentRequest.EnrollmentRequestStatus.PENDING)
					.organizationId(student.getOrganizationId())
					.build();

			courseEnrollmentRequestRepository.save(request);

			Map<String, Object> resp = new HashMap<>();
			resp.put("requestId", request.getId());
			resp.put("status", request.getStatus().name());

			return ResponseEntity.ok(ApiResponse.ok("Enrollment request submitted successfully", resp));
		}

		@Transactional
		@GetMapping("/enrollment-requests")
		public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyEnrollmentRequests(
				@AuthenticationPrincipal Student student) {
			
			List<CourseEnrollmentRequest> reqs = courseEnrollmentRequestRepository.findByStudentId(student.getId());
			List<Map<String, Object>> result = reqs.stream().map(r -> {
				Map<String, Object> m = new HashMap<>();
				m.put("id", r.getId());
				m.put("courseId", r.getCourse() != null ? r.getCourse().getId() : null);
				m.put("courseTitle", r.getCourse() != null ? r.getCourse().getTitle() : "—");
				m.put("status", r.getStatus() != null ? r.getStatus().name() : "PENDING");
				m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
				return m;
			}).collect(Collectors.toList());

			return ResponseEntity.ok(ApiResponse.ok(result));
		}

		// ── STUDENT ASSESSMENT APIS ──────────────────────────────────────────

		@GetMapping("/assessments")
		public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAssessments(
				@AuthenticationPrincipal Student student,
				@RequestParam Long courseId) {
			List<Assessment> list = assessmentRepository.findByCourse(courseRepository.findById(courseId).orElse(null));
			List<Map<String, Object>> result = list.stream().map(a -> {
				Map<String, Object> m = new HashMap<>();
				m.put("id", a.getId());
				m.put("title", a.getTitle());
				m.put("assessmentType", a.getAssessmentType());
				m.put("totalMarks", a.getTotalMarks());
				m.put("passMarks", a.getPassMarks());
				m.put("durationMinutes", a.getDurationMinutes());
				m.put("instructions", a.getInstructions());
				m.put("startDate", a.getStartDate() != null ? a.getStartDate().toString() : null);
				m.put("endDate", a.getEndDate() != null ? a.getEndDate().toString() : null);
				m.put("status", a.getStatus());

				java.util.Optional<AssessmentAttempt> optAttempt = assessmentAttemptRepository.findByAssessmentIdAndStudent(a.getId(), student);
				if (optAttempt.isPresent()) {
					AssessmentAttempt att = optAttempt.get();
					m.put("attemptStatus", att.getStatus());
					m.put("attemptId", att.getId());
					if (a.isShowResultImmediately() || att.isResultsPublished()) {
						m.put("totalScore", att.getTotalScore());
					}
				} else {
					m.put("attemptStatus", "NOT_STARTED");
				}
				return m;
			}).collect(Collectors.toList());

			return ResponseEntity.ok(ApiResponse.ok(result));
		}

		@PostMapping("/assessments/{id}/start")
		@Transactional
		public ResponseEntity<ApiResponse<Map<String, Object>>> startAssessment(
				@AuthenticationPrincipal Student student,
				@PathVariable Long id) {
			Assessment assessment = assessmentRepository.findById(id)
					.orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));

			java.util.Optional<AssessmentAttempt> optAttempt = assessmentAttemptRepository.findByAssessmentIdAndStudent(id, student);
			AssessmentAttempt attempt;
			if (optAttempt.isPresent()) {
				attempt = optAttempt.get();
				if ("SUBMITTED".equals(attempt.getStatus()) || "GRADED".equals(attempt.getStatus())) {
					throw new BadRequestException("Assessment already submitted");
				}
			} else {
				LocalDateTime now = LocalDateTime.now();
				if (assessment.getStartDate() != null && now.isBefore(assessment.getStartDate())) {
					throw new BadRequestException("Assessment has not started yet.");
				}
				if (assessment.getEndDate() != null && now.isAfter(assessment.getEndDate())) {
					throw new BadRequestException("Assessment window has already closed.");
				}

				attempt = AssessmentAttempt.builder()
						.assessment(assessment)
						.student(student)
						.startedAt(LocalDateTime.now())
						.status("IN_PROGRESS")
						.build();
				assessmentAttemptRepository.save(attempt);
			}

			List<AssessmentQuestion> questions = assessmentQuestionRepository.findByAssessmentId(id);

			List<Map<String, Object>> sanitizedQuestions = questions.stream().map(q -> {
				Map<String, Object> qm = new HashMap<>();
				qm.put("id", q.getId());
				qm.put("questionText", q.getQuestionText());
				qm.put("questionType", q.getQuestionType());
				qm.put("optionsJson", q.getOptionsJson());
				qm.put("marks", q.getMarks());
				qm.put("difficulty", q.getDifficulty());
				qm.put("imageUrl", q.getImageUrl());
				return qm;
			}).collect(Collectors.toList());

			List<AssessmentAnswer> existingAnswers = assessmentAnswerRepository.findByAttemptId(attempt.getId());
			Map<Long, String> savedAnswersMap = existingAnswers.stream()
					.collect(Collectors.toMap(ans -> ans.getQuestion().getId(), AssessmentAnswer::getStudentAnswer));

			Map<String, Object> res = new HashMap<>();
			res.put("attemptId", attempt.getId());
			res.put("startedAt", attempt.getStartedAt().toString());
			res.put("durationMinutes", assessment.getDurationMinutes());
			res.put("instructions", assessment.getInstructions());
			res.put("title", assessment.getTitle());
			res.put("questions", sanitizedQuestions);
			res.put("savedAnswers", savedAnswersMap);

			return ResponseEntity.ok(ApiResponse.ok(res));
		}

		@PostMapping("/assessments/attempts/{attemptId}/save")
		@Transactional
		public ResponseEntity<ApiResponse<Void>> saveProgress(
				@PathVariable Long attemptId,
				@RequestBody Map<String, String> answers) {
			AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
					.orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

			if (!"IN_PROGRESS".equals(attempt.getStatus())) {
				throw new BadRequestException("Attempt is not in progress");
			}

			List<AssessmentAnswer> existing = assessmentAnswerRepository.findByAttemptId(attemptId);
			Map<Long, AssessmentAnswer> existingMap = existing.stream()
					.collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a));

			for (Map.Entry<String, String> entry : answers.entrySet()) {
				Long qId = Long.valueOf(entry.getKey());
				String val = entry.getValue();

				AssessmentAnswer ans = existingMap.get(qId);
				if (ans == null) {
					AssessmentQuestion q = assessmentQuestionRepository.findById(qId)
							.orElseThrow(() -> new ResourceNotFoundException("Question not found"));
					ans = AssessmentAnswer.builder()
							.attempt(attempt)
							.question(q)
							.build();
				}
				ans.setStudentAnswer(val);
				assessmentAnswerRepository.save(ans);
			}

			return ResponseEntity.ok(ApiResponse.ok("Progress auto-saved", null));
		}

		@PostMapping("/assessments/attempts/{attemptId}/submit")
		@Transactional
		public ResponseEntity<ApiResponse<Map<String, Object>>> submitAssessmentAttempt(
				@PathVariable Long attemptId,
				@RequestBody Map<String, Object> body) {
			AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
					.orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

			if (!"IN_PROGRESS".equals(attempt.getStatus())) {
				throw new BadRequestException("Attempt is not in progress");
			}

			if (body.containsKey("answers")) {
				@SuppressWarnings("unchecked")
				Map<String, String> answers = (Map<String, String>) body.get("answers");
				List<AssessmentAnswer> existing = assessmentAnswerRepository.findByAttemptId(attemptId);
				Map<Long, AssessmentAnswer> existingMap = existing.stream()
						.collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a));

				for (Map.Entry<String, String> entry : answers.entrySet()) {
					Long qId = Long.valueOf(entry.getKey());
					String val = entry.getValue();

					AssessmentAnswer ans = existingMap.get(qId);
					if (ans == null) {
						AssessmentQuestion q = assessmentQuestionRepository.findById(qId)
								.orElseThrow(() -> new ResourceNotFoundException("Question not found"));
						ans = AssessmentAnswer.builder()
								.attempt(attempt)
								.question(q)
								.build();
					}
					ans.setStudentAnswer(val);
					assessmentAnswerRepository.save(ans);
				}
			}

			if (body.containsKey("tabSwitchCount")) {
				attempt.setTabSwitchCount(Integer.parseInt(body.get("tabSwitchCount").toString()));
			}

			List<AssessmentAnswer> answers = assessmentAnswerRepository.findByAttemptId(attemptId);
			double scoreSum = 0.0;
			boolean hasDescriptive = false;

			for (AssessmentAnswer ans : answers) {
				AssessmentQuestion q = ans.getQuestion();
				if ("MCQ".equalsIgnoreCase(q.getQuestionType()) 
						|| "TRUE_FALSE".equalsIgnoreCase(q.getQuestionType()) 
						|| "FILL_IN_BLANKS".equalsIgnoreCase(q.getQuestionType())) {
					
					String correctVal = q.getCorrectAnswer();
					String studentVal = ans.getStudentAnswer();
					if (correctVal != null && correctVal.trim().equalsIgnoreCase(studentVal != null ? studentVal.trim() : "")) {
						ans.setMarksObtained(q.getMarks());
						scoreSum += q.getMarks();
					} else {
						ans.setMarksObtained(0.0);
					}
					assessmentAnswerRepository.save(ans);
				} else {
					hasDescriptive = true;
				}
			}

			attempt.setSubmittedAt(LocalDateTime.now());

			if (hasDescriptive) {
				attempt.setStatus("SUBMITTED");
			} else {
				attempt.setStatus("GRADED");
				attempt.setTotalScore(scoreSum);
				attempt.setGradedAt(LocalDateTime.now());
			}

			assessmentAttemptRepository.save(attempt);

			Map<String, Object> response = new HashMap<>();
			response.put("attemptId", attempt.getId());
			response.put("status", attempt.getStatus());
			if ("GRADED".equals(attempt.getStatus())) {
				response.put("totalScore", attempt.getTotalScore());
			}

			return ResponseEntity.ok(ApiResponse.ok("Assessment submitted successfully", response));
		}

		@PostMapping("/assessments/attempts/{attemptId}/tab-switch")
		@Transactional
		public ResponseEntity<ApiResponse<Void>> incrementTabSwitch(
				@PathVariable Long attemptId) {
			AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
					.orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));
			attempt.setTabSwitchCount(attempt.getTabSwitchCount() + 1);
			assessmentAttemptRepository.save(attempt);
			return ResponseEntity.ok(ApiResponse.ok("Tab switch recorded", null));
		}
}
