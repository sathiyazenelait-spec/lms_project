package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import com.zenelait.lms.entity.*;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.*;
import com.zenelait.lms.service.mail.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
@Slf4j
public class MeetingController {

    private final MeetingRepository meetingRepository;
    private final MeetingQuestionRepository questionRepository;
    private final MeetingParticipantRepository participantRepository;
    private final MeetingResponseRepository responseRepository;
    private final MeetingAuditLogRepository auditLogRepository;
    private final AdminRepository adminRepository;
    private final TeacherRepository teacherRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    // ── CREATE MEETING ──────────────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMeeting(
            @AuthenticationPrincipal Admin creator,
            @RequestBody Map<String, Object> body) {

        Long orgId = creator.getOrganizationId();
        String name = (String) body.get("name");
        String type = (String) body.get("type"); // ONLINE, OPINION, OFFLINE
        String desc = (String) body.get("description");
        String recurring = (String) body.getOrDefault("recurringType", "ONCE");

        Meeting meeting = Meeting.builder()
                .name(name)
                .type(type)
                .status("UPCOMING")
                .organizationId(orgId)
                .createdBy(creator.getId())
                .description(desc)
                .recurringType(recurring)
                .build();

        // Parse dates depending on type
        if ("ONLINE".equals(type) || "OFFLINE".equals(type)) {
            meeting.setStartDate(LocalDateTime.parse((String) body.get("startDate")));
            meeting.setEndDate(LocalDateTime.parse((String) body.get("endDate")));
            if ("ONLINE".equals(type)) {
                meeting.setPlatformType((String) body.get("platformType"));
                meeting.setJoinLink((String) body.get("joinLink"));
            } else {
                meeting.setVenue((String) body.get("venue"));
                meeting.setCoordinatorName((String) body.get("coordinatorName"));
            }
        } else if ("OPINION".equals(type)) {
            meeting.setDeadline(LocalDateTime.parse((String) body.get("deadline")));
        }

        meetingRepository.save(meeting);

        // 1. Questions (Opinion only)
        if ("OPINION".equals(type) && body.containsKey("questions")) {
            List<Map<String, Object>> qList = (List<Map<String, Object>>) body.get("questions");
            for (Map<String, Object> qMap : qList) {
                String qText = (String) qMap.get("questionText");
                String optType = (String) qMap.get("optionType");
                String custOptions = (String) qMap.get("customOptions"); // comma-separated

                MeetingQuestion mq = MeetingQuestion.builder()
                        .meetingId(meeting.getId())
                        .questionText(qText)
                        .optionType(optType)
                        .customOptions(custOptions)
                        .build();
                questionRepository.save(mq);
            }
        }

        // 2. Participants
        List<Map<String, Object>> pList = (List<Map<String, Object>>) body.get("participants");
        for (Map<String, Object> pMap : pList) {
            String pType = (String) pMap.get("type"); // ADMIN, TEACHER
            Object uIdObj = pMap.get("userId") != null ? pMap.get("userId") : pMap.get("id");
            Long uId = Long.valueOf(uIdObj.toString());
            String email = (String) pMap.get("email");
            String pName = (String) pMap.get("name");

            MeetingParticipant mp = MeetingParticipant.builder()
                    .meetingId(meeting.getId())
                    .participantType(pType)
                    .userId(uId)
                    .email(email)
                    .name(pName)
                    .build();
            participantRepository.save(mp);
        }

        // 3. Audit Log
        auditLogRepository.save(MeetingAuditLog.builder()
                .meetingId(meeting.getId())
                .action("CREATE")
                .userId(creator.getId())
                .userRole(creator.isSuperAdmin() ? "SUPER_ADMIN" : "ADMIN")
                .userName(creator.getName())
                .details("Created meeting: " + name + " (" + type + ")")
                .build());

        // 4. Initial Notifications & Styled Email
        Admin superAdmin = resolveSuperAdmin(creator);
        String senderName = superAdmin != null ? superAdmin.getName() : creator.getName();
        String senderEmail = superAdmin != null ? superAdmin.getEmail() : creator.getEmail();
        sendMeetingCreationNotifications(meeting, creator.getName(), senderName, senderEmail);

        return ResponseEntity.ok(ApiResponse.ok("Meeting created successfully", toMap(meeting)));
    }

    // ── EDIT MEETING ────────────────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> editMeeting(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, Object> body) {

        Meeting m = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + id));

        if (!admin.getOrganizationId().equals(m.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        if (!"UPCOMING".equals(m.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only upcoming meetings can be edited."));
        }

        String oldName = m.getName();
        m.setName((String) body.get("name"));
        m.setDescription((String) body.get("description"));
        m.setRecurringType((String) body.getOrDefault("recurringType", "ONCE"));
        m.setReminderSent(false); // Reset reminders
        m.setDeadlineReminderSent(false);

        String type = m.getType();
        if ("ONLINE".equals(type) || "OFFLINE".equals(type)) {
            m.setStartDate(LocalDateTime.parse((String) body.get("startDate")));
            m.setEndDate(LocalDateTime.parse((String) body.get("endDate")));
            if ("ONLINE".equals(type)) {
                m.setPlatformType((String) body.get("platformType"));
                m.setJoinLink((String) body.get("joinLink"));
            } else {
                m.setVenue((String) body.get("venue"));
                m.setCoordinatorName((String) body.get("coordinatorName"));
            }
        } else if ("OPINION".equals(type)) {
            m.setDeadline(LocalDateTime.parse((String) body.get("deadline")));
        }

        meetingRepository.save(m);

        // 1. Reset & Re-save Questions
        if ("OPINION".equals(type) && body.containsKey("questions")) {
            questionRepository.deleteByMeetingId(m.getId());
            List<Map<String, Object>> qList = (List<Map<String, Object>>) body.get("questions");
            for (Map<String, Object> qMap : qList) {
                MeetingQuestion mq = MeetingQuestion.builder()
                        .meetingId(m.getId())
                        .questionText((String) qMap.get("questionText"))
                        .optionType((String) qMap.get("optionType"))
                        .customOptions((String) qMap.get("customOptions"))
                        .build();
                questionRepository.save(mq);
            }
        }

        // 2. Reset & Re-save Participants
        participantRepository.deleteByMeetingId(m.getId());
        List<Map<String, Object>> pList = (List<Map<String, Object>>) body.get("participants");
        for (Map<String, Object> pMap : pList) {
            MeetingParticipant mp = MeetingParticipant.builder()
                    .meetingId(m.getId())
                    .participantType((String) pMap.get("type"))
                    .userId(Long.valueOf((pMap.get("userId") != null ? pMap.get("userId") : pMap.get("id")).toString()))
                    .email((String) pMap.get("email"))
                    .name((String) pMap.get("name"))
                    .build();
            participantRepository.save(mp);
        }

        // 3. Audit Log
        auditLogRepository.save(MeetingAuditLog.builder()
                .meetingId(m.getId())
                .action("EDIT")
                .userId(admin.getId())
                .userRole(admin.isSuperAdmin() ? "SUPER_ADMIN" : "ADMIN")
                .userName(admin.getName())
                .details("Edited meeting details from '" + oldName + "' to '" + m.getName() + "'")
                .build());

        // 4. Send Update Notification
        Admin superAdmin = resolveSuperAdmin(admin);
        String senderName = superAdmin != null ? superAdmin.getName() : admin.getName();
        String senderEmail = superAdmin != null ? superAdmin.getEmail() : admin.getEmail();
        sendMeetingUpdateNotifications(m, admin.getName(), senderName, senderEmail);

        return ResponseEntity.ok(ApiResponse.ok("Meeting updated successfully", toMap(m)));
    }

    // ── CANCEL MEETING ──────────────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelMeeting(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, String> body) {

        Meeting m = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + id));

        if (!admin.getOrganizationId().equals(m.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        String reason = body.getOrDefault("reason", "No reason provided");
        m.setStatus("CANCELLED");
        m.setCancelReason(reason);
        meetingRepository.save(m);

        // Audit Log
        auditLogRepository.save(MeetingAuditLog.builder()
                .meetingId(m.getId())
                .action("CANCEL")
                .userId(admin.getId())
                .userRole(admin.isSuperAdmin() ? "SUPER_ADMIN" : "ADMIN")
                .userName(admin.getName())
                .details("Cancelled meeting: " + m.getName() + ". Reason: " + reason)
                .build());

        // Notify cancellation
        Admin superAdmin = resolveSuperAdmin(admin);
        String senderName = superAdmin != null ? superAdmin.getName() : admin.getName();
        String senderEmail = superAdmin != null ? superAdmin.getEmail() : admin.getEmail();
        sendCancellationNotifications(m, reason, admin.getName(), senderName, senderEmail);

        return ResponseEntity.ok(ApiResponse.ok("Meeting cancelled successfully", null));
    }

    // ── DELETE MEETING ──────────────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMeeting(
            @PathVariable Long id,
            @AuthenticationPrincipal Admin admin) {

        if (!admin.isSuperAdmin()) {
            return ResponseEntity.status(403).body(ApiResponse.error("Only Super Admins can delete meetings."));
        }

        Meeting m = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + id));

        if (!admin.getOrganizationId().equals(m.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        questionRepository.deleteByMeetingId(m.getId());
        participantRepository.deleteByMeetingId(m.getId());
        responseRepository.deleteByMeetingId(m.getId());
        meetingRepository.delete(m);

        return ResponseEntity.ok(ApiResponse.ok("Meeting hard deleted successfully", null));
    }

    // ── FETCH MEETINGS ──────────────────────────────────────────────────────────
    @Transactional
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMeetings(
            @AuthenticationPrincipal UserDetails userPrincipal) {

        Long orgId = null;
        boolean isAdmin = false;
        Long userId = null;
        String userRole = "";

        if (userPrincipal instanceof Admin admin) {
            orgId = admin.getOrganizationId();
            isAdmin = true;
            userId = admin.getId();
            userRole = "ADMIN";
        } else if (userPrincipal instanceof Teacher teacher) {
            orgId = teacher.getOrganizationId();
            isAdmin = false;
            userId = teacher.getId();
            userRole = "TEACHER";
        }

        if (orgId == null) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }

        List<Meeting> allOrgMeetings = meetingRepository.findByOrganizationId(orgId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Meeting m : allOrgMeetings) {
            boolean include = false;
            // Admin/Super Admin sees all
            if (isAdmin) {
                include = true;
            } else {
                // Teacher only sees if they are a participant
                Optional<MeetingParticipant> mp = participantRepository
                        .findByMeetingIdAndParticipantTypeAndUserId(m.getId(), userRole, userId);
                if (mp.isPresent()) {
                    include = true;
                }
            }

            if (include) {
                result.add(toMap(m));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── CHECK CONFLICTS ─────────────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/check-conflicts")
    public ResponseEntity<ApiResponse<List<String>>> checkConflicts(
            @AuthenticationPrincipal Admin admin,
            @RequestBody Map<String, Object> body) {

        Long orgId = admin.getOrganizationId();
        if (body.get("startDate") == null || body.get("endDate") == null) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }

        LocalDateTime start = LocalDateTime.parse((String) body.get("startDate"));
        LocalDateTime end = LocalDateTime.parse((String) body.get("endDate"));
        List<Map<String, Object>> inputParticipants = (List<Map<String, Object>>) body.get("participants");

        if (inputParticipants == null || inputParticipants.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok(new ArrayList<>()));
        }

        // Get overlapping meetings in this organization
        List<Meeting> overlappingMeetings = meetingRepository.findOverlappingMeetings(orgId, start, end);
        List<String> warnings = new ArrayList<>();

        for (Meeting m : overlappingMeetings) {
            List<MeetingParticipant> activeParticipants = participantRepository.findByMeetingId(m.getId());
            for (Map<String, Object> ip : inputParticipants) {
                String ipType = (String) ip.get("type");
                Long ipId = Long.valueOf((ip.get("userId") != null ? ip.get("userId") : ip.get("id")).toString());
                String ipName = (String) ip.get("name");

                boolean isOverlapObj = activeParticipants.stream()
                        .anyMatch(ap -> ap.getParticipantType().equalsIgnoreCase(ipType) && ap.getUserId().equals(ipId));

                if (isOverlapObj) {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                    warnings.add(ipName + " (" + ipType + ") has an overlapping meeting: '" + m.getName() + 
                                 "' scheduled from " + m.getStartDate().format(formatter) + " to " + m.getEndDate().format(formatter));
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(warnings));
    }

    // ── OPINION POLL RESPONSE SUBMISSION ────────────────────────────────────────
    @Transactional
    @PostMapping("/{meetingId}/respond")
    public ResponseEntity<ApiResponse<Void>> submitOpinionResponse(
            @PathVariable Long meetingId,
            @AuthenticationPrincipal UserDetails userPrincipal,
            @RequestBody List<Map<String, Object>> responses) {

        Long userId = null;
        String userRole = "";
        Long orgId = null;
        if (userPrincipal instanceof Admin a) {
            userId = a.getId();
            userRole = "ADMIN";
            orgId = a.getOrganizationId();
        } else if (userPrincipal instanceof Teacher t) {
            userId = t.getId();
            userRole = "TEACHER";
            orgId = t.getOrganizationId();
        }

        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Meeting m = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + meetingId));

        if (orgId == null || !orgId.equals(m.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        if (!"UPCOMING".equals(m.getStatus()) && !"ONGOING".equals(m.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cannot submit response. Poll has closed or meeting is not active."));
        }

        if (m.getDeadline() != null && LocalDateTime.now().isAfter(m.getDeadline())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Opinion submission deadline has passed."));
        }

        // Verify participant
        Optional<MeetingParticipant> mp = participantRepository
                .findByMeetingIdAndParticipantTypeAndUserId(meetingId, userRole, userId);
        if (mp.isEmpty()) {
            return ResponseEntity.status(403).body(ApiResponse.error("You are not invited to participate in this meeting poll."));
        }

        for (Map<String, Object> r : responses) {
            Long qId = Long.valueOf(r.get("questionId").toString());
            String ans = (String) r.get("answer");

            Optional<MeetingResponse> existing = responseRepository.findByMeetingIdAndQuestionIdAndUserId(meetingId, qId, userId);
            if (existing.isPresent()) {
                MeetingResponse mr = existing.get();
                mr.setAnswer(ans);
                mr.setRespondedAt(LocalDateTime.now());
                responseRepository.save(mr);
            } else {
                MeetingResponse mr = MeetingResponse.builder()
                        .meetingId(meetingId)
                        .questionId(qId)
                        .userId(userId)
                        .answer(ans)
                        .build();
                responseRepository.save(mr);
            }
        }

        return ResponseEntity.ok(ApiResponse.ok("Response recorded successfully", null));
    }

    // ── MARK ATTENDANCE (ADMIN MANUAL) ──────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @PostMapping("/{meetingId}/attendance")
    public ResponseEntity<ApiResponse<Void>> markAttendance(
            @PathVariable Long meetingId,
            @AuthenticationPrincipal Admin admin,
            @RequestBody List<Map<String, Object>> attendanceList) {

        Meeting m = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + meetingId));

        if (!admin.getOrganizationId().equals(m.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        List<MeetingParticipant> participants = participantRepository.findByMeetingId(meetingId);

        for (Map<String, Object> att : attendanceList) {
            Long pId = Long.valueOf(att.get("participantId").toString());
            Boolean attVal = (Boolean) att.get("attended");

            participants.stream()
                    .filter(p -> p.getId().equals(pId))
                    .findFirst()
                    .ifPresent(p -> {
                        p.setAttended(attVal);
                        if (Boolean.TRUE.equals(attVal)) {
                            p.setCheckInTime(LocalDateTime.now());
                        } else {
                            p.setCheckInTime(null);
                        }
                        participantRepository.save(p);
                    });
        }

        return ResponseEntity.ok(ApiResponse.ok("Attendance report updated", null));
    }

    // ── SELF CHECK-IN (TEACHER/PARTICIPANT) ─────────────────────────────────────
    @Transactional
    @PostMapping("/{meetingId}/attendance/self")
    public ResponseEntity<ApiResponse<Void>> selfCheckIn(
            @PathVariable Long meetingId,
            @AuthenticationPrincipal UserDetails userPrincipal) {

        Long userId = null;
        String userRole = "";
        Long orgId = null;
        if (userPrincipal instanceof Admin a) {
            userId = a.getId();
            userRole = "ADMIN";
            orgId = a.getOrganizationId();
        } else if (userPrincipal instanceof Teacher t) {
            userId = t.getId();
            userRole = "TEACHER";
            orgId = t.getOrganizationId();
        }

        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Meeting m = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + meetingId));

        if (orgId == null || !orgId.equals(m.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        MeetingParticipant mp = participantRepository
                .findByMeetingIdAndParticipantTypeAndUserId(meetingId, userRole, userId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not registered as a participant for this meeting."));

        mp.setAttended(true);
        mp.setCheckInTime(LocalDateTime.now());
        participantRepository.save(mp);

        return ResponseEntity.ok(ApiResponse.ok("Self check-in completed successfully!", null));
    }

    // ── SEND ABSENTEE FOLLOW-UP EMAILS ──────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @PostMapping("/{meetingId}/absentees/follow-up")
    public ResponseEntity<ApiResponse<Void>> sendAbsenteeFollowUp(
            @PathVariable Long meetingId,
            @AuthenticationPrincipal Admin admin) {

        Meeting m = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + meetingId));

        if (!admin.getOrganizationId().equals(m.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        List<MeetingParticipant> absentees = participantRepository.findByMeetingId(meetingId).stream()
                .filter(p -> Boolean.FALSE.equals(p.getAttended()))
                .collect(Collectors.toList());

        if (absentees.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok("No absentees to notify", null));
        }

        String title = "⚠️ Follow-up: Absence from Meeting: " + m.getName();
        String msg = "We noticed that you were unable to attend the meeting '" + m.getName() + "'. Please reach out to the coordinator.";
        
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="background:linear-gradient(135deg,#b91c1c,#ef4444);padding:24px 32px;">
                <h2 style="color:#fff;margin:0;font-size:22px;">⚠️ Meeting Absence Follow-up</h2>
                <p style="color:#fff;margin:6px 0 0;font-size:12px;opacity:0.8;">ZenelaitLMS Attendance Tracker</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;font-size:18px;">Meeting: %s</h3>
                <p style="color:#4b5563;font-size:14px;line-height:1.6;">
                  We noticed you were marked as <strong>Absent</strong> for the meeting scheduled on <strong>%s</strong>.<br/><br/>
                  If this was a mistake or you have queries about the agenda details discussed, please contact the coordinator/host: <strong>%s</strong>.
                </p>
                <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
                <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
                  This is an automated attendance follow-up from ZenelaitLMS.
                </p>
              </div>
            </div>
            """.formatted(m.getName(), m.getStartDate() != null ? m.getStartDate().toString() : "N/A", 
                          m.getVenue() != null ? m.getCoordinatorName() : "Admin");

        Admin superAdmin = resolveSuperAdmin(admin);
        String senderName = superAdmin != null ? superAdmin.getName() : admin.getName();
        String senderEmail = superAdmin != null ? superAdmin.getEmail() : admin.getEmail();

        for (MeetingParticipant p : absentees) {
            saveNotif(p.getEmail(), title, msg, Notification.NotificationType.WARNING);
            emailService.send(p.getEmail(), title, html, senderName, senderEmail);
        }

        return ResponseEntity.ok(ApiResponse.ok("Follow-up notifications sent to " + absentees.size() + " absentees.", null));
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

    // ── NOTIFICATION HELPERS ────────────────────────────────────────────────────
    private void sendMeetingCreationNotifications(Meeting m, String creatorName, String senderName, String senderEmail) {
        String title = "📅 New Meeting Scheduled: " + m.getName();
        String typeDesc = m.getType().equals("ONLINE") ? "Online (via " + m.getPlatformType() + ")" :
                          m.getType().equals("OFFLINE") ? "Offline (at " + m.getVenue() + ")" : "Opinion Poll / Ballot";
        
        String detailsHtml = getMeetingDetailsHtml(m);

        String html = buildStyledEmail("New Meeting Invitation", m.getName(), 
            "You have been invited to participate in a new " + typeDesc + " meeting.<br/><br/>" + detailsHtml
        );

        List<MeetingParticipant> participants = participantRepository.findByMeetingId(m.getId());
        for (MeetingParticipant p : participants) {
            saveNotif(p.getEmail(), title, "You have been invited to a new meeting: " + m.getName() + " (" + typeDesc + ")", Notification.NotificationType.INFO);
            emailService.send(p.getEmail(), title, html, senderName, senderEmail);
        }
    }

    private void sendMeetingUpdateNotifications(Meeting m, String updaterName, String senderName, String senderEmail) {
        String title = "📅 Meeting Details Updated: " + m.getName();
        String typeDesc = m.getType().equals("ONLINE") ? "Online (via " + m.getPlatformType() + ")" :
                          m.getType().equals("OFFLINE") ? "Offline (at " + m.getVenue() + ")" : "Opinion Poll / Ballot";

        String detailsHtml = getMeetingDetailsHtml(m);

        String html = buildStyledEmail("Meeting Details Updated", m.getName(), 
            "An administrator (" + updaterName + ") has updated the schedule/details for this meeting.<br/><br/>" + detailsHtml
        );

        List<MeetingParticipant> participants = participantRepository.findByMeetingId(m.getId());
        for (MeetingParticipant p : participants) {
            saveNotif(p.getEmail(), title, "Meeting details updated: " + m.getName(), Notification.NotificationType.WARNING);
            emailService.send(p.getEmail(), title, html, senderName, senderEmail);
        }
    }

    private void sendCancellationNotifications(Meeting m, String reason, String cancellerName, String senderName, String senderEmail) {
        String title = "❌ Meeting Cancelled: " + m.getName();
        String html = buildStyledEmail("Meeting Cancellation Alert", m.getName(), 
            "Please note that the meeting scheduled for " + 
            (m.getStartDate() != null ? m.getStartDate().toString() : "N/A") + " has been <strong>Cancelled</strong> by " + cancellerName + ".<br/><br/>" +
            "<strong>Cancellation Reason:</strong> " + reason
        );

        List<MeetingParticipant> participants = participantRepository.findByMeetingId(m.getId());
        for (MeetingParticipant p : participants) {
            saveNotif(p.getEmail(), title, "Meeting Cancelled: " + m.getName() + ". Reason: " + reason, Notification.NotificationType.ERROR);
            emailService.send(p.getEmail(), title, html, senderName, senderEmail);
        }
    }

    private String getMeetingDetailsHtml(Meeting m) {
        if ("ONLINE".equals(m.getType())) {
            return "<strong>Platform:</strong> " + m.getPlatformType() + "<br/>" +
                   "<strong>Start Time:</strong> " + m.getStartDate().toString() + "<br/>" +
                   "<strong>End Time:</strong> " + m.getEndDate().toString() + "<br/>" +
                   "<strong>Join Link:</strong> <a href=\"" + m.getJoinLink() + "\">" + m.getJoinLink() + "</a><br/>" +
                   "<strong>Agenda:</strong> " + m.getDescription();
        } else if ("OFFLINE".equals(m.getType())) {
            return "<strong>Venue:</strong> " + m.getVenue() + "<br/>" +
                   "<strong>Start Time:</strong> " + m.getStartDate().toString() + "<br/>" +
                   "<strong>End Time:</strong> " + m.getEndDate().toString() + "<br/>" +
                   "<strong>Host/Coordinator:</strong> " + m.getCoordinatorName() + "<br/>" +
                   "<strong>Agenda:</strong> " + m.getDescription();
        } else {
            return "<strong>Poll Deadline:</strong> " + m.getDeadline().toString() + "<br/>" +
                   "<strong>Description:</strong> " + m.getDescription() + "<br/>" +
                   "Please visit your dashboard to participate.";
        }
    }

    private void saveNotif(String email, String title, String msg, Notification.NotificationType type) {
        notificationRepository.save(Notification.builder()
                .recipientEmail(email).title(title).message(msg).type(type).read(false).build());
    }

    private String buildStyledEmail(String headerText, String meetingName, String bodyHtml) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="background:linear-gradient(135deg,#1e1b4b,#7c3aed);padding:24px 32px;">
                <h2 style="color:#fff;margin:0;font-size:22px;">📅 %s</h2>
                <p style="color:#eab308;margin:6px 0 0;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:12px;">ZenelaitLMS Schedule Connect</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;font-size:18px;">%s</h3>
                <div style="color:#4b5563;font-size:14px;line-height:1.6;margin-top:16px;">
                  %s
                </div>
                <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
                <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
                  This is an automated meeting alert from ZenelaitLMS. Please do not reply directly to this email.
                </p>
              </div>
            </div>
            """.formatted(headerText, meetingName, bodyHtml);
    }

    // ── DATA MAPPING HELPER ─────────────────────────────────────────────────────
    private Map<String, Object> toMap(Meeting m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("name", m.getName());
        map.put("type", m.getType());
        map.put("status", m.getStatus());
        map.put("createdBy", m.getCreatedBy());
        map.put("coordinatorName", m.getCoordinatorName());
        map.put("startDate", m.getStartDate() != null ? m.getStartDate().toString() : null);
        map.put("endDate", m.getEndDate() != null ? m.getEndDate().toString() : null);
        map.put("description", m.getDescription());
        map.put("recurringType", m.getRecurringType());
        map.put("cancelReason", m.getCancelReason());
        map.put("platformType", m.getPlatformType());
        map.put("joinLink", m.getJoinLink());
        map.put("venue", m.getVenue());
        map.put("deadline", m.getDeadline() != null ? m.getDeadline().toString() : null);

        // Fetch Questions
        List<MeetingQuestion> qs = questionRepository.findByMeetingId(m.getId());
        List<Map<String, Object>> qMapList = qs.stream().map(q -> {
            Map<String, Object> qm = new LinkedHashMap<>();
            qm.put("id", q.getId());
            qm.put("questionText", q.getQuestionText());
            qm.put("optionType", q.getOptionType());
            qm.put("customOptions", q.getCustomOptions());
            return qm;
        }).collect(Collectors.toList());
        map.put("questions", qMapList);

        // Fetch Participants
        List<MeetingParticipant> ps = participantRepository.findByMeetingId(m.getId());
        List<Map<String, Object>> pMapList = ps.stream().map(p -> {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("id", p.getId());
            pm.put("userId", p.getUserId());
            pm.put("type", p.getParticipantType());
            pm.put("email", p.getEmail());
            pm.put("name", p.getName());
            pm.put("attended", p.getAttended());
            pm.put("checkInTime", p.getCheckInTime() != null ? p.getCheckInTime().toString() : null);
            return pm;
        }).collect(Collectors.toList());
        map.put("participants", pMapList);

        // Fetch responses
        List<MeetingResponse> rs = responseRepository.findByMeetingId(m.getId());
        List<Map<String, Object>> rMapList = rs.stream().map(r -> {
            Map<String, Object> rm = new LinkedHashMap<>();
            rm.put("id", r.getId());
            rm.put("questionId", r.getQuestionId());
            rm.put("userId", r.getUserId());
            rm.put("answer", r.getAnswer());
            rm.put("respondedAt", r.getRespondedAt().toString());
            return rm;
        }).collect(Collectors.toList());
        map.put("responses", rMapList);

        return map;
    }
}
