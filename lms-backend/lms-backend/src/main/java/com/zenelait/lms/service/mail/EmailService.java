package com.zenelait.lms.service.mail;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${lms.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${spring.mail.username}")
    private String smtpUsername;

    @Value("${lms.email.display-name:ZenelaitLMS}")
    private String defaultDisplayName;

    // ── Result type ────────────────────────────────────────────────────────────

    public enum EmailStatus { SENT, DISABLED, INVALID_ADDRESS, FAILED }

    @Getter
    public static class EmailResult {
        private final EmailStatus status;
        private final String to;
        private final String userMessage; // shown in frontend popup
        private final String logMessage;  // exact error for logs

        private EmailResult(EmailStatus status, String to, String userMessage, String logMessage) {
            this.status      = status;
            this.to          = to;
            this.userMessage = userMessage;
            this.logMessage  = logMessage;
        }

        public static EmailResult sent(String to) {
            return new EmailResult(EmailStatus.SENT, to, null, null);
        }
        public static EmailResult disabled(String to) {
            return new EmailResult(EmailStatus.DISABLED, to, null, "Email disabled in config");
        }
        public static EmailResult invalidAddress(String to, String detail) {
            return new EmailResult(EmailStatus.INVALID_ADDRESS, to,
                    "Can't reach the email: " + to, detail);
        }
        public static EmailResult failed(String to, String detail) {
            return new EmailResult(EmailStatus.FAILED, to,
                    "Failed to send mail to " + to, detail);
        }

        public boolean isOk()     { return status == EmailStatus.SENT || status == EmailStatus.DISABLED; }
        public boolean isError()  { return !isOk(); }
    }

    // ── Core send (synchronous — caller decides threading) ─────────────────────

    public EmailResult send(String to, String subject, String htmlBody,
                            String senderName, String senderEmail) {
        if (!emailEnabled) {
            log.info("Email disabled — skipping: [{}] → {}", subject, to);
            return EmailResult.disabled(to);
        }

        // Basic address validation before even trying SMTP
        if (to == null || to.isBlank() || !to.contains("@")) {
            String detail = "Invalid 'To' address: '" + to + "'";
            log.warn("Email skipped — {}", detail);
            return EmailResult.invalidAddress(to, detail);
        }
        if (smtpUsername == null || smtpUsername.isBlank() || !smtpUsername.contains("@")) {
            String detail = "Invalid SMTP 'From' address: '" + smtpUsername + "' — check application.properties";
            log.error("Email skipped — {}", detail);
            return EmailResult.invalidAddress(smtpUsername, detail);
        }

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

            String actualFromEmail = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail : smtpUsername;
            String actualFromName = (senderName != null && !senderName.isBlank()) ? senderName : "ZenelaitLMS";
            helper.setFrom(actualFromEmail, actualFromName);

            if (senderEmail != null && !senderEmail.isBlank()) {
                helper.setReplyTo(senderEmail);
            }

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);

            log.info("✅ Email sent: [{}] → {} (from: {} <{}>, reply-to: {})",
                    subject, to, actualFromName, actualFromEmail, senderEmail);
            return EmailResult.sent(to);

        } catch (AddressException e) {
            // Invalid email address format
            String detail = "Invalid address format: " + e.getMessage();
            log.warn("❌ Email address error [{}] → {}: {}", subject, to, detail);
            return EmailResult.invalidAddress(to, detail);

        } catch (jakarta.mail.AuthenticationFailedException e) {
            String detail = "SMTP authentication failed — wrong Gmail App Password? Error: " + e.getMessage();
            log.error("❌ Email auth error [{}] → {}: {}", subject, to, detail);
            return EmailResult.failed(to, detail);

        } catch (org.springframework.mail.MailSendException e) {
            // Covers invalid recipient, connection issues, etc.
            String detail = e.getMessage();
            // Check if it's an invalid address error
            if (detail != null && (detail.contains("Invalid Addresses") || detail.contains("550") || detail.contains("551"))) {
                log.warn("❌ Email invalid address [{}] → {}: {}", subject, to, detail);
                return EmailResult.invalidAddress(to, detail);
            }
            log.error("❌ Email send failed [{}] → {}: {}", subject, to, detail);
            return EmailResult.failed(to, detail);

        } catch (Exception e) {
            String detail = e.getClass().getSimpleName() + ": " + e.getMessage();
            log.error("❌ Email unexpected error [{}] → {}: {}", subject, to, detail, e);
            return EmailResult.failed(to, detail);
        }
    }

    /** Send with system sender */
    public EmailResult send(String to, String subject, String htmlBody) {
        return send(to, subject, htmlBody, defaultDisplayName, null);
    }

    /** Send to multiple — returns list of results */
    public List<EmailResult> sendToAll(List<String> recipients, String subject, String htmlBody,
                                        String senderName, String senderEmail) {
        return recipients.stream()
                .map(to -> send(to, subject, htmlBody, senderName, senderEmail))
                .toList();
    }

    public List<EmailResult> sendToAll(List<String> recipients, String subject, String htmlBody) {
        return recipients.stream().map(to -> send(to, subject, htmlBody)).toList();
    }

    // ── HTML Templates ─────────────────────────────────────────────────────────

    public String newRegistrationEmail(String role, String name, String email, String userId) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;font-size:22px;">🎓 ZenelaitLMS</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">New Registration Alert</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">New %s Registered</h3>
                <table style="width:100%%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;color:#111827;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;font-weight:600;color:#111827;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">ID</td><td style="padding:8px 0;font-weight:600;color:#7c3aed;">%s</td></tr>
                </table>
                <p style="color:#6b7280;font-size:13px;margin-top:20px;">Login to your admin dashboard to review this registration.</p>
              </div>
            </div>
            """.formatted(role, name, email, userId);
    }

    public String materialUploadEmail(String teacherName, String courseTitle,
                                       String materialType, String materialTitle,
                                       String description, String contentUrl) {
        String icon = switch (materialType) {
            case "VIDEO"     -> "🎥";
            case "MEET_LINK" -> "🔗";
            default          -> "📝";
        };
        String typeLabel = switch (materialType) {
            case "VIDEO"     -> "Video";
            case "MEET_LINK" -> "Live Class Link";
            default          -> "Note / Document";
        };
        String actionBtn = contentUrl != null && !contentUrl.startsWith("data:") ?
            "<a href=\"" + contentUrl + "\" style=\"display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:14px;\">Open " + typeLabel + " →</a>" : "";

        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;">%s ZenelaitLMS Learning Board</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">New material uploaded for your course</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">%s: %s</h3>
                <table style="width:100%%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Course</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Teacher</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Type</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
                  %s
                </table>
                %s
                <p style="color:#6b7280;font-size:13px;margin-top:20px;">Login to ZenelaitLMS to view the full material.</p>
              </div>
            </div>
            """.formatted(
                icon, typeLabel, materialTitle,
                courseTitle, teacherName, typeLabel,
                description != null && !description.isBlank() ?
                    "<tr><td style='padding:8px 0;color:#6b7280;'>Description</td><td style='padding:8px 0;'>" + description + "</td></tr>" : "",
                actionBtn
        );
    }

    public String feeNotificationEmail(String studentName, String courseName,
                                        String feeType, String amount,
                                        String dueDate, String description) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#dc2626,#f59e0b);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;">💳 ZenelaitLMS Fee Notice</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">A new fee has been added to your account</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">Fee Details for %s</h3>
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:18px 20px;margin-bottom:18px;">
                  <table style="width:100%%;border-collapse:collapse;">
                    <tr><td style="padding:6px 0;color:#6b7280;width:130px;">Amount</td><td style="padding:6px 0;font-weight:800;font-size:20px;color:#dc2626;">₹%s</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280;">Due Date</td><td style="padding:6px 0;font-weight:700;color:#111827;">%s</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280;">Fee Type</td><td style="padding:6px 0;font-weight:600;">%s</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280;">Course</td><td style="padding:6px 0;">%s</td></tr>
                    %s
                  </table>
                </div>
                <p style="color:#dc2626;font-weight:600;">Please ensure payment is made before the due date to avoid penalties.</p>
                <p style="color:#6b7280;font-size:13px;">Login to ZenelaitLMS to view full fee details and payment history.</p>
              </div>
            </div>
            """.formatted(
                studentName, amount, dueDate, feeType, courseName,
                description != null && !description.isBlank() ?
                    "<tr><td style='padding:6px 0;color:#6b7280;'>Description</td><td style='padding:6px 0;'>" + description + "</td></tr>" : ""
            );
    }

    public String subscriptionExpiryEmail(String orgName, String planName, int daysLeft, String expiryDate) {
        String warningColor = daysLeft <= 1 ? "#ef4444" : "#f59e0b";
        String daysText = daysLeft == 1 ? "tomorrow" : "in " + daysLeft + " days";
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,%s,#ef4444);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;">⚠️ Subscription Expiration Alert</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">Your organization plan is expiring soon</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">Attention Admin,</h3>
                <p style="color:#374151;line-height:1.6;">
                  This is to notify you that the subscription plan for <strong>%s</strong> will expire <strong>%s</strong> (%s).
                </p>
                <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:18px 20px;margin-bottom:18px;">
                  <table style="width:100%%;border-collapse:collapse;">
                    <tr><td style="padding:6px 0;color:#6b7280;width:130px;">Organization</td><td style="padding:6px 0;font-weight:700;color:#111827;">%s</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280;">Current Plan</td><td style="padding:6px 0;font-weight:700;color:#111827;">%s</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280;">Expiry Date</td><td style="padding:6px 0;font-weight:700;color:#dc2626;">%s</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280;">Days Remaining</td><td style="padding:6px 0;font-weight:800;color:#d97706;">%d days</td></tr>
                  </table>
                </div>
                <p style="color:#374151;line-height:1.6;">
                  To avoid any disruption of service, please log in to your dashboard and renew or select a new subscription package.
                </p>
                <p style="color:#6b7280;font-size:13px;margin-top:24px;">ZenelaitLMS Operations Team</p>
              </div>
            </div>
            """.formatted(warningColor, orgName, daysText, expiryDate, orgName, planName, expiryDate, daysLeft);
    }

    public String forgotPasswordOtpEmail(String name, String otp) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px;">
                <h2 style="color:#fff;margin:0;font-size:22px;">🎓 ZenelaitLMS</h2>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;">Password Reset Verification Code</p>
              </div>
              <div style="padding:28px 32px;background:#fff;">
                <h3 style="color:#1e1b4b;margin-top:0;">Hello %s,</h3>
                <p style="color:#374151;line-height:1.6;">
                  We received a request to reset your password. Use the verification code (OTP) below to complete your password reset:
                </p>
                <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
                  <span style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#7c3aed;">%s</span>
                </div>
                <p style="color:#ef4444;font-weight:600;font-size:14px;">
                  This code is valid for 10 minutes. Do not share this code with anyone.
                </p>
                <p style="color:#6b7280;font-size:13px;margin-top:24px;">
                  If you did not request a password reset, you can safely ignore this email.
                </p>
                <p style="color:#6b7280;font-size:13px;margin-top:12px;">ZenelaitLMS Operations Team</p>
              </div>
            </div>
            """.formatted(name, otp);
    }
}
