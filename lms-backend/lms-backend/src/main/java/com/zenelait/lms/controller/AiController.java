package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final StudentRepository       studentRepository;
    private final ParentRepository        parentRepository;
    private final TeacherRepository       teacherRepository;
    private final AdminRepository         adminRepository;
    private final ParentChildRepository  parentChildRepository;
    private final AttendanceRepository   attendanceRepository;
    private final FeeRepository          feeRepository;
    private final CourseRepository       courseRepository;
    private final BatchRepository          batchRepository;
    private final ExamResultRepository    examResultRepository;
    private final TeacherReviewRepository teacherReviewRepository;
    private final CertificateRepository   certificateRepository;
    private final CourseEnrollmentRequestRepository courseEnrollmentRequestRepository;

    @org.springframework.beans.factory.annotation.Value("${gemini.api.key:}")
    private String geminiApiKey;

    @org.springframework.beans.factory.annotation.Value("${huggingface.api.key:}")
    private String huggingfaceApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String callHuggingFace(String systemPrompt, String userMessage) {
        if (huggingfaceApiKey == null || huggingfaceApiKey.trim().isEmpty()) {
            return "⚠️ Hugging Face API key is missing. Please set 'huggingface.api.key' in application.properties.";
        }

        try {
            String url = "https://api-inference.huggingface.co/v1/chat/completions";

            // Construct payload compatible with OpenAI/HF Chat Completion API
            Map<String, Object> systemMsg = Map.of("role", "system", "content", systemPrompt);
            Map<String, Object> userMsg = Map.of("role", "user", "content", userMessage);
            Map<String, Object> payload = Map.of(
                "model", "Qwen/Qwen2.5-72B-Instruct",
                "messages", List.of(systemMsg, userMsg),
                "max_tokens", 800
            );

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + huggingfaceApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
            return "🤖 (Hugging Face Error) Code: " + response.statusCode() + " - " + response.body();
        } catch (Exception e) {
            return "⚠️ Could not connect to Hugging Face Assistant: " + e.getMessage();
        }
    }

    private String callGemini(String prompt) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return "⚠️ Gemini API key is missing. Please set 'gemini.api.key' in application.properties.";
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

            // Structure prompt according to Gemini API payload format
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> parts = Map.of("parts", List.of(textPart));
            Map<String, Object> contents = Map.of("contents", List.of(parts));

            String requestBody = objectMapper.writeValueAsString(contents);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    if (content != null) {
                        List<Map<String, Object>> partsList = (List<Map<String, Object>>) content.get("parts");
                        if (partsList != null && !partsList.isEmpty()) {
                            return (String) partsList.get(0).get("text");
                        }
                    }
                }
            }
            return "🤖 (Gemini Error) Code: " + response.statusCode() + " - " + response.body();
        } catch (Exception e) {
            return "⚠️ Could not connect to Gemini Assistant: " + e.getMessage();
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(@RequestBody Map<String, String> body) {
        String message = body.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message cannot be empty"));
        }

        // Get authentication details
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Object principal = auth.getPrincipal();
        String email = null;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        }

        if (email == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        String role = "UNKNOWN";
        String userName = "User";
        String responseText = "";

        // Check Student Role
        Optional<Student> studentOpt = studentRepository.findByEmail(email);
        if (studentOpt.isPresent()) {
            role = "STUDENT";
            Student s = studentOpt.get();
            userName = s.getName();
            responseText = handleStudentAi(s, message.toLowerCase());
        } 
        // Check Parent Role
        else {
            Optional<Parent> parentOpt = parentRepository.findByEmail(email);
            if (parentOpt.isPresent()) {
                role = "PARENT";
                Parent p = parentOpt.get();
                userName = p.getName();
                responseText = handleParentAi(p, message.toLowerCase());
            } 
            // Check Teacher Role
            else {
                Optional<Teacher> teacherOpt = teacherRepository.findByEmail(email);
                if (teacherOpt.isPresent()) {
                    role = "TEACHER";
                    Teacher t = teacherOpt.get();
                    userName = t.getName();
                    responseText = handleTeacherAi(t, message.toLowerCase());
                } 
                // Check Admin Role
                else {
                    Optional<Admin> adminOpt = adminRepository.findByEmail(email);
                    if (adminOpt.isPresent()) {
                        role = "ADMIN";
                        Admin a = adminOpt.get();
                        userName = a.getName();
                        responseText = handleAdminAi(a, message.toLowerCase());
                    }
                }
            }
        }

        if (role.equals("UNKNOWN")) {
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "reply", "Hello! I am the ZenelaitLMS AI Assistant. I was unable to determine your account role. Please log in with a valid Student, Teacher, Parent, or Admin account."
            )));
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "role", role,
            "userName", userName,
            "reply", responseText
        )));
    }

    // ── Student AI Logic ──────────────────────────────────────────────
    private String handleStudentAi(Student student, String msg) {
        String faqReply = AiFaqHelper.getStudentResponse(msg);
        if (faqReply != null) return faqReply;

        if (msg.contains("attendance")) {
            List<Attendance> records = attendanceRepository.findByStudentId(student.getId());
            if (records.isEmpty()) {
                return "I searched the database and couldn't find any attendance logs for your enrolled courses yet.";
            }
            long present = records.stream().filter(r -> r.getStatus() == Attendance.AttendanceStatus.PRESENT).count();
            double pct = (present * 100.0) / records.size();
            return String.format("📈 **Attendance Summary**:\n* Total Classes Tracked: %d\n* Present: %d\n* Overall Attendance Percentage: **%.1f%%**",
                    records.size(), present, pct);
        }

        if (msg.contains("timetable") || msg.contains("class") || msg.contains("tomorrow") || msg.contains("today") || msg.contains("schedule")) {
            List<Course> directCourses = courseRepository.findDirectlyEnrolledByStudentId(student.getId());
            return "📅 **My Classes & Timetable**:\n" +
                   "You are currently registered in direct and batch courses. Under your Timetable tab, you will find active schedules. " +
                   (directCourses.isEmpty() ? "No direct course schedules are active." : "Direct Courses active: " + 
                   directCourses.stream().map(Course::getTitle).collect(Collectors.joining(", ")));
        }

        if (msg.contains("certificate")) {
            List<Certificate> certs = certificateRepository.findByStudentIdOrderByIssueDateDesc(student.getId());
            if (certs.isEmpty()) {
                return "🎓 **Certificates**: You haven't earned any certificates yet. Once you complete a course and your teacher issues a certificate, it will show up here!";
            }
            String certList = certs.stream()
                    .map(c -> String.format("- **%s**: Grade **%s**, Issued on %s (Cert No: %s)", 
                            c.getCourse() != null ? c.getCourse().getTitle() : "Course",
                            c.getGrade(), c.getIssueDate(), c.getCertificateNumber()))
                    .collect(Collectors.joining("\n"));
            return "🎓 **My Earned Certificates**:\n" + certList;
        }

        if (msg.contains("fee") || msg.contains("unpaid") || msg.contains("invoice")) {
            List<Fee> fees = feeRepository.findByStudent(student);
            List<Fee> unpaid = fees.stream()
                    .filter(f -> f.getStatus() != Fee.FeeStatus.PAID)
                    .collect(Collectors.toList());
            if (unpaid.isEmpty()) {
                return "💸 **Fee Statement**: You have no pending/unpaid invoices. Excellent!";
            }
            String feeList = unpaid.stream()
                    .map(f -> String.format("- %s: **₹%,.2f** (Status: %s)", f.getFeeType(), f.getAmount().doubleValue(), f.getStatus().name()))
                    .collect(Collectors.joining("\n"));
            return "💸 **My Outstanding Fees (Unpaid)**:\n" + feeList + "\n\n*Please inform your parent to clear these invoices via their Parent Wallet dashboard.*";
        }

        if (msg.contains("java") || msg.contains("inheritance")) {
            return "💻 **Smart Coding Assistant (Java Inheritance)**:\n\n" +
                   "Inheritance is a key concept in Object-Oriented Programming (OOP) that allows one class (child/subclass) to inherit fields and methods from another class (parent/superclass).\n\n" +
                   "**Example Code:**\n" +
                   "```java\n" +
                   "// Parent Class\n" +
                   "class Animal {\n" +
                   "    void eat() { System.out.println(\"Eating...\"); }\n" +
                   "}\n" +
                   "// Child Class inheriting Animal\n" +
                   "class Dog extends Animal {\n" +
                   "    void bark() { System.out.println(\"Barking...\"); }\n" +
                   "}\n" +
                   "```\n" +
                   "*Best Practice: Use the `@Override` annotation when redefining parent methods in the child class!*";
        }

        if (msg.contains("assignment") || msg.contains("grade") || msg.contains("performance")) {
            List<ExamResult> exams = examResultRepository.findByStudentId(student.getId());
            if (exams.isEmpty()) {
                return "📚 **Performance Summary**: No exam results have been graded yet. Keep checking the performance page as your teachers post your evaluations!";
            }
            String grades = exams.stream()
                    .map(e -> String.format("- %s: **%s** (%d%%)", e.getExam().getTitle(), e.getGrade(), e.getMarksObtained() * 100 / e.getExam().getMaxMarks()))
                    .collect(Collectors.joining("\n"));
            return "📚 **My Academic Achievements**:\n" + grades;
        }

        String systemPrompt = String.format(
            "You are the Student Academic AI Assistant for ZenelaitLMS. The student's name is %s. " +
            "Answer their question in a friendly, encouraging academic tone. Keep formatting nice and readable.", student.getName()
        );

        if (huggingfaceApiKey != null && !huggingfaceApiKey.trim().isEmpty()) {
            return callHuggingFace(systemPrompt, msg);
        }

        return callGemini(systemPrompt + "\n\nHere is the question they asked: " + msg);
    }

    // ── Parent AI Logic ───────────────────────────────────────────────
    private String handleParentAi(Parent parent, String msg) {
        String faqReply = AiFaqHelper.getParentResponse(msg);
        if (faqReply != null) return faqReply;

        List<ParentChild> links = parentChildRepository.findByParent(parent);
        if (links.isEmpty()) {
            return "I couldn't find any linked student profiles associated with your parent account. Please link your child first using their Student ID (e.g. STU-xxx) in the Child Management tab.";
        }
        Student child = links.get(0).getChild();

        if (msg.contains("attendance")) {
            List<Attendance> records = attendanceRepository.findByStudentId(child.getId());
            if (records.isEmpty()) {
                return "I couldn't find any attendance logs recorded for " + child.getName() + " yet.";
            }
            long present = records.stream().filter(r -> r.getStatus() == Attendance.AttendanceStatus.PRESENT).count();
            double pct = (present * 100.0) / records.size();
            return String.format("📈 **Child Attendance Tracker (%s)**:\n* Total Classes: %d\n* Present: %d\n* Overall Attendance: **%.1f%%**",
                    child.getName(), records.size(), present, pct);
        }

        if (msg.contains("fee") || msg.contains("payment") || msg.contains("wallet")) {
            List<Fee> fees = feeRepository.findByStudent(child);
            List<Fee> unpaid = fees.stream()
                    .filter(f -> f.getStatus() != Fee.FeeStatus.PAID)
                    .collect(Collectors.toList());
            if (unpaid.isEmpty()) {
                return String.format("💳 **Fees & Wallet Overview (%s)**:\n* Your child has no pending fees. All invoices are fully paid!\n* Parent Wallet balance is maintained in your dashboard.", child.getName());
            }
            String feeList = unpaid.stream()
                    .map(f -> String.format("- %s: **₹%,.2f** (Status: %s)", f.getFeeType(), f.getAmount().doubleValue(), f.getStatus().name()))
                    .collect(Collectors.joining("\n"));
            return String.format("💳 **Fees & Wallet Overview (%s)**:\n" +
                   "Pending Fee Invoices:\n%s\n\n*You can recharge your Parent Wallet using Razorpay and pay these bills instantly in the Fee Dashboard!*",
                   child.getName(), feeList);
        }

        if (msg.contains("performance") || msg.contains("grade") || msg.contains("progress")) {
            List<ExamResult> exams = examResultRepository.findByStudentId(child.getId());
            if (exams.isEmpty()) {
                return "📊 **Academic Report**: No exams have been graded for " + child.getName() + " yet. I will notify you as soon as report cards are published!";
            }
            String grades = exams.stream()
                    .map(e -> String.format("- %s: **%s**", e.getExam().getTitle(), e.getGrade()))
                    .collect(Collectors.joining("\n"));
            return "📊 **Academic Performance Summary (" + child.getName() + ")**:\n" + grades;
        }

        if (msg.contains("certificate")) {
            List<Certificate> certs = certificateRepository.findByStudentIdOrderByIssueDateDesc(child.getId());
            if (certs.isEmpty()) {
                return "🎓 **Certificates**: Your child, " + child.getName() + ", hasn't earned any certificates yet. I'll notify you as soon as one is issued!";
            }
            String certList = certs.stream()
                    .map(c -> String.format("- **%s**: Grade **%s**, Issued on %s", 
                            c.getCourse() != null ? c.getCourse().getTitle() : "Course",
                            c.getGrade(), c.getIssueDate()))
                    .collect(Collectors.joining("\n"));
            return "🎓 **Certificates Earned by " + child.getName() + "**:\n" + certList;
        }

        return "👋 Welcome " + parent.getName() + "! As a **Parent AI Companion**, I assist you in tracking your child's education. Try asking me:\n\n" +
               "* 'How is my child performing academically?'\n" +
               "* 'Show my child's attendance percentage'\n" +
               "* 'What are the pending fees for my child?'\n" +
               "* 'Has my child earned any certificates?'";
    }

    // ── Teacher AI Logic ──────────────────────────────────────────────
    private String handleTeacherAi(Teacher teacher, String msg) {
        String faqReply = AiFaqHelper.getTeacherResponse(msg);
        if (faqReply != null) return faqReply;

        if (msg.contains("ratings") || msg.contains("reviews") || msg.contains("performance") || msg.contains("stars") || msg.contains("feedback")) {
            List<TeacherReview> reviews = teacherReviewRepository.findByTeacherIdOrderByCreatedAtDesc(teacher.getId());
            Double avgRating = teacherReviewRepository.getAverageRatingForTeacher(teacher.getId());
            if (avgRating == null) {
                avgRating = 0.0;
            }
            String reviewSummary = reviews.isEmpty() 
                ? "No reviews have been submitted by students yet." 
                : reviews.stream()
                         .limit(3)
                         .map(r -> String.format("- **%s** (%d★): \"%s\"", 
                                 r.getStudent() != null ? r.getStudent().getName() : "Anonymous Student",
                                 r.getRating(), r.getReviewText()))
                         .collect(Collectors.joining("\n"));

            return String.format("⭐ **My Performance & Student Ratings**:\n\n" +
                   "* **Average Rating**: **%.1f/5.0**\n" +
                   "* **Total Reviews**: %d\n\n" +
                   "**Latest Feedback Preview**:\n%s\n\n" +
                   "*Tip: Students submit reviews directly from their Course Learning Board after enrollment.*",
                   avgRating, reviews.size(), reviewSummary);
        }

        if (msg.contains("student") || msg.contains("classroom") || msg.contains("enrollment")) {
            List<Course> courses = courseRepository.findByTeacher(teacher);
            return "👨‍🎓 **Classroom & Course Statistics**:\n" +
                   "* You have **" + courses.size() + "** active courses assigned to you.\n" +
                   "* Assigned Courses: " + courses.stream().map(Course::getTitle).collect(Collectors.joining(", ")) + "\n" +
                   "Use the 'My Courses' panel to issue certificates or view student attendance roster.";
        }

        if (msg.contains("mcq") || msg.contains("quiz") || msg.contains("question")) {
            return "📝 **AI Quiz Generator (Java Core Concept)**:\n\n" +
                   "Here are 3 generated Multiple Choice Questions for your next class:\n\n" +
                   "**Q1. Which of the following is NOT an OOP pillar?**\n" +
                   "A) Encapsulation\n" +
                   "B) Compilation (Correct)\n" +
                   "C) Polymorphism\n" +
                   "D) Inheritance\n\n" +
                   "**Q2. Which keyword is used to inherit a class in Java?**\n" +
                   "A) implements\n" +
                   "B) extends (Correct)\n" +
                   "C) inherits\n" +
                   "D) import\n\n" +
                   "**Q3. What is the default value of an uninitialized local object reference in Java?**\n" +
                   "A) null (Correct)\n" +
                   "B) void\n" +
                   "C) undefined\n" +
                   "D) empty";
        }

        if (msg.contains("lesson") || msg.contains("plan") || msg.contains("curriculum") || msg.contains("schedule")) {
            return "📅 **AI Lesson & Course Completion Planner**:\n\n" +
                   "**Recommended 4-Week Progress Plan for Java Programming:**\n" +
                   "* **Week 1**: Basic Syntax, Variables, Control Flow.\n" +
                   "* **Week 2**: Arrays, Lists, OOP Introductions (Classes & Objects).\n" +
                   "* **Week 3**: Advanced OOP (Inheritance, Interfaces, Polymorphism).\n" +
                   "* **Week 4**: Exceptions handling, Collections framework, Course Quiz.\n\n" +
                   "Use the *Schedules Management* panel to link these lessons directly to weekly calendar slots!";
        }

        return "👋 Hello Professor " + teacher.getName() + "! As your **AI Teaching Assistant**, I help you reduce prep time. Try asking me:\n\n" +
               "* 'Show my student reviews and performance'\n" +
               "* 'What are my classroom & course statistics?'\n" +
               "* 'Generate 10 Java MCQs for exam preparation'\n" +
               "* 'Create a 4-week lesson plan for OOP concepts'\n" +
               "* 'Summarize my weekly classroom schedules'";
    }

    // ── Admin AI Logic ────────────────────────────────────────────────
    private String handleAdminAi(Admin admin, String msg) {
        String faqReply = AiFaqHelper.getAdminResponse(msg);
        if (faqReply != null) return faqReply;

        if (msg.contains("request") || msg.contains("pending") || msg.contains("enrollment")) {
            List<CourseEnrollmentRequest> pending = courseEnrollmentRequestRepository
                    .findByOrganizationIdAndStatus(admin.getOrganizationId(), CourseEnrollmentRequest.EnrollmentRequestStatus.PENDING);
            if (pending.isEmpty()) {
                return "📥 **Enrollment Requests**: There are no pending course enrollment requests awaiting your approval at this time.";
            }
            return String.format("📥 **Enrollment Requests Alert**:\n" +
                   "There are **%d pending course enrollment requests** from students waiting for your approval.\n" +
                   "Go to the 'Enrollment Requests' dashboard tab in the sidebar to review and approve them.",
                   pending.size());
        }

        if (msg.contains("review") || msg.contains("rating") || msg.contains("teacher") || msg.contains("performance")) {
            List<Teacher> teachers = teacherRepository.findByOrganizationId(admin.getOrganizationId());
            if (teachers.isEmpty()) {
                return "⭐ **Teacher Reviews**: No teacher accounts exist in your organization yet.";
            }
            StringBuilder sb = new StringBuilder("⭐ **Organization Teacher Ratings Summary**:\n");
            for (Teacher t : teachers) {
                Double avg = teacherReviewRepository.getAverageRatingForTeacher(t.getId());
                Long count = teacherReviewRepository.countReviewsForTeacher(t.getId());
                sb.append(String.format("- **%s**: Average Rating: **%s** (%d review(s))\n", 
                        t.getName(), (avg != null ? String.format("%.1f", avg) : "No rating yet"), count));
            }
            return sb.toString();
        }

        if (msg.contains("revenue") || msg.contains("income") || msg.contains("fee") || msg.contains("invoice")) {
            List<Fee> allFees = feeRepository.findAll();
            // Filter by organization if students have it
            double totalPaid = allFees.stream()
                    .filter(f -> f.getStatus() == Fee.FeeStatus.PAID)
                    .mapToDouble(f -> f.getAmount().doubleValue())
                    .sum();
            double totalPending = allFees.stream()
                    .filter(f -> f.getStatus() != Fee.FeeStatus.PAID)
                    .mapToDouble(f -> f.getAmount().doubleValue())
                    .sum();
            return String.format("📊 **ZenelaitLMS Financial Analytics**:\n" +
                   "* Total Paid Invoices: **₹%,.2f**\n" +
                   "* Total Outstanding/Pending: **₹%,.2f**\n" +
                   "The AI Agent automatic invoicing engine keeps collection effort extremely low by emailing auto-reminders weekly!",
                   totalPaid, totalPending);
        }

        if (msg.contains("automation") || msg.contains("improve") || msg.contains("work")) {
            return "🤖 **Admin Automation Suggestions (Low Effort Operation)**:\n\n" +
                   "1. **Automatic Invoicing**: Our platform now auto-sends notifications and invoice triggers to Parents as soon as quarterly fee slabs open.\n" +
                   "2. **Timetable Smart Mapping**: Admins can batch-add students to courses without conflict checks, saving 80% scheduling time.\n" +
                   "3. **AI Performance Alert**: Students dropping below 75% attendance are automatically flagged and added to the admin's daily advisory dashboard.";
        }

        return "👋 Welcome Administrator " + admin.getName() + "! As your **LMS Intelligence & Automation Agent**, I help you run ZenelaitLMS with low effort. Try asking me:\n\n" +
               "* 'Are there any pending enrollment requests?'\n" +
               "* 'Show my organization's teacher ratings summary'\n" +
               "* 'Show platform revenue and invoice insights'\n" +
               "* 'How can I use AI agents to automate daily operations?'";
    }
}
