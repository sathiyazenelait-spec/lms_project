package com.zenelait.lms.service.meeting;

import com.zenelait.lms.entity.*;
import com.zenelait.lms.repository.*;
import com.zenelait.lms.service.mail.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class MeetingScheduler {

    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository participantRepository;
    private final MeetingResponseRepository responseRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final AdminRepository adminRepository;

    @Scheduled(fixedRate = 60000) // run every 1 minute
    @Transactional
    public void processMeetings() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Transition Statuses
        List<Meeting> activeMeetings = meetingRepository.findByStatus("UPCOMING");
        for (Meeting m : activeMeetings) {
            if ("ONLINE".equals(m.getType()) || "OFFLINE".equals(m.getType())) {
                if (m.getStartDate() != null && m.getEndDate() != null) {
                    if (now.isAfter(m.getStartDate()) && now.isBefore(m.getEndDate())) {
                        m.setStatus("ONGOING");
                        meetingRepository.save(m);
                        log.info("Meeting ID {} changed status to ONGOING", m.getId());
                    } else if (now.isAfter(m.getEndDate())) {
                        m.setStatus("COMPLETED");
                        meetingRepository.save(m);
                        log.info("Meeting ID {} changed status to COMPLETED", m.getId());
                    }
                }
            } else if ("OPINION".equals(m.getType())) {
                if (m.getDeadline() != null && now.isAfter(m.getDeadline())) {
                    m.setStatus("COMPLETED");
                    meetingRepository.save(m);
                    log.info("Opinion Meeting ID {} changed status to COMPLETED", m.getId());
                }
            }
        }

        List<Meeting> ongoingMeetings = meetingRepository.findByStatus("ONGOING");
        for (Meeting m : ongoingMeetings) {
            if (m.getEndDate() != null && now.isAfter(m.getEndDate())) {
                m.setStatus("COMPLETED");
                meetingRepository.save(m);
                log.info("Meeting ID {} changed status to COMPLETED", m.getId());
            }
        }

        // 2. Alarm Reminders (1 Hour Before for ONLINE)
        List<Meeting> upcomingOnline = meetingRepository.findByStatusAndReminderSentFalse("UPCOMING");
        for (Meeting m : upcomingOnline) {
            if ("ONLINE".equals(m.getType()) && m.getStartDate() != null) {
                if (now.isBefore(m.getStartDate()) && m.getStartDate().isBefore(now.plusHours(1))) {
                    sendOnlineReminder(m);
                    m.setReminderSent(true);
                    meetingRepository.save(m);
                }
            }
        }

        // 3. Alarm Reminders (1 Day Before for OFFLINE)
        List<Meeting> upcomingOffline = meetingRepository.findByStatusAndReminderSentFalse("UPCOMING");
        for (Meeting m : upcomingOffline) {
            if ("OFFLINE".equals(m.getType()) && m.getStartDate() != null) {
                if (now.isBefore(m.getStartDate()) && m.getStartDate().isBefore(now.plusDays(1))) {
                    sendOfflineReminder(m);
                    m.setReminderSent(true);
                    meetingRepository.save(m);
                }
            }
        }

        // 4. Opinion Deadline Reminders (24 Hours Before)
        List<Meeting> upcomingOpinions = meetingRepository.findByTypeAndStatusAndDeadlineReminderSentFalse("OPINION", "UPCOMING");
        for (Meeting m : upcomingOpinions) {
            if (m.getDeadline() != null) {
                if (now.isBefore(m.getDeadline()) && m.getDeadline().isBefore(now.plusDays(1))) {
                    sendOpinionDeadlineReminder(m);
                    m.setDeadlineReminderSent(true);
                    meetingRepository.save(m);
                }
            }
        }
    }

    private void sendOnlineReminder(Meeting m) {
        String title = "⏰ Reminder: Online Meeting starting soon";
        String msg = "The meeting '" + m.getName() + "' starts at " + m.getStartDate().toString() + ". Join link: " + m.getJoinLink();
        String html = buildStyledEmail("Online Meeting Reminder", m.getName(), 
            "Your online meeting is scheduled to start in less than an hour.<br/><br/>" +
            "<strong>Platform:</strong> " + m.getPlatformType() + "<br/>" +
            "<strong>Start Time:</strong> " + m.getStartDate().toString() + "<br/>" +
            "<strong>Join Link:</strong> <a href=\"" + m.getJoinLink() + "\" style=\"color:#7c3aed;font-weight:700;\">" + m.getJoinLink() + "</a><br/>" +
            "<strong>Agenda:</strong> " + m.getDescription()
        );

        notifyParticipants(m, title, msg, html);
    }

    private void sendOfflineReminder(Meeting m) {
        String title = "⏰ Reminder: Offline Meeting tomorrow";
        String msg = "The meeting '" + m.getName() + "' is scheduled for tomorrow at " + m.getStartDate().toString() + " at " + m.getVenue();
        String html = buildStyledEmail("Offline Meeting Reminder", m.getName(), 
            "You have an upcoming offline meeting scheduled for tomorrow.<br/><br/>" +
            "<strong>Venue/Location:</strong> " + m.getVenue() + "<br/>" +
            "<strong>Start Time:</strong> " + m.getStartDate().toString() + "<br/>" +
            "<strong>Coordinator:</strong> " + m.getCoordinatorName() + "<br/>" +
            "<strong>Agenda:</strong> " + m.getDescription()
        );

        notifyParticipants(m, title, msg, html);
    }

    private void sendOpinionDeadlineReminder(Meeting m) {
        List<MeetingParticipant> participants = participantRepository.findByMeetingId(m.getId());
        List<MeetingResponse> responses = responseRepository.findByMeetingId(m.getId());
        
        List<Long> respondedUserIds = responses.stream()
                .map(MeetingResponse::getUserId)
                .collect(Collectors.toList());

        List<MeetingParticipant> pendingParticipants = participants.stream()
                .filter(p -> !respondedUserIds.contains(p.getUserId()))
                .collect(Collectors.toList());

        String title = "⏰ Action Required: Opinion Poll Deadline Tomorrow";
        String msg = "The opinion poll for topic '" + m.getName() + "' deadline is tomorrow at " + m.getDeadline().toString() + ". Please submit your response.";
        String html = buildStyledEmail("Opinion Poll Reminder", m.getName(), 
            "The deadline for submitting your opinion on this topic is approaching.<br/><br/>" +
            "<strong>Topic:</strong> " + m.getName() + "<br/>" +
            "<strong>Deadline:</strong> " + m.getDeadline().toString() + "<br/>" +
            "Please log in to the ZenelaitLMS Admin Dashboard to submit your vote."
        );

        Admin superAdmin = resolveSuperAdminForMeeting(m);
        String senderName = superAdmin != null ? superAdmin.getName() : "ZenelaitLMS Meetings";
        String senderEmail = superAdmin != null ? superAdmin.getEmail() : null;

        for (MeetingParticipant p : pendingParticipants) {
            saveNotif(p.getEmail(), title, msg, Notification.NotificationType.WARNING);
            emailService.send(p.getEmail(), title, html, senderName, senderEmail);
        }
        log.info("Sent opinion deadline reminders to {} pending participants for meeting ID {}", pendingParticipants.size(), m.getId());
    }

    private void notifyParticipants(Meeting m, String title, String msg, String html) {
        Admin superAdmin = resolveSuperAdminForMeeting(m);
        String senderName = superAdmin != null ? superAdmin.getName() : "ZenelaitLMS Meetings";
        String senderEmail = superAdmin != null ? superAdmin.getEmail() : null;

        List<MeetingParticipant> participants = participantRepository.findByMeetingId(m.getId());
        for (MeetingParticipant p : participants) {
            saveNotif(p.getEmail(), title, msg, Notification.NotificationType.INFO);
            emailService.send(p.getEmail(), title, html, senderName, senderEmail);
        }
        log.info("Sent reminders to {} participants for meeting ID {}", participants.size(), m.getId());
    }

    private Admin resolveSuperAdminForMeeting(Meeting meeting) {
        if (meeting == null || meeting.getOrganizationId() == null) return null;
        List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(meeting.getOrganizationId());
        if (!superAdmins.isEmpty()) {
            return superAdmins.get(0);
        }
        return null;
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
}
