package com.zenelait.lms.service.subscription;

import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Notification;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.entity.OrganizationSubscription;
import com.zenelait.lms.entity.SubscriptionPackage;
import com.zenelait.lms.entity.UltraSuperAdmin;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.NotificationRepository;
import com.zenelait.lms.repository.OrganizationRepository;
import com.zenelait.lms.repository.OrganizationSubscriptionRepository;
import com.zenelait.lms.repository.SubscriptionPackageRepository;
import com.zenelait.lms.repository.UltraSuperAdminRepository;
import com.zenelait.lms.service.mail.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionPackageRepository packageRepository;
    private final OrganizationSubscriptionRepository subscriptionRepository;
    private final OrganizationRepository organizationRepository;
    private final AdminRepository adminRepository;
    private final UltraSuperAdminRepository usaRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    // ── Package CRUD ─────────────────────────────────────────────────────────

    public SubscriptionPackage createPackage(SubscriptionPackage pkg) {
        if (pkg.getDurationDays() == null || pkg.getDurationDays() <= 0) {
            pkg.setDurationDays(pkg.getPackageType().equalsIgnoreCase("YEARLY") ? 365 : 30);
        }
        return packageRepository.save(pkg);
    }

    public List<SubscriptionPackage> getAllPackages() {
        return packageRepository.findAll();
    }

    public List<SubscriptionPackage> getActivePackages() {
        return packageRepository.findByActiveTrue();
    }

    public SubscriptionPackage togglePackageActive(Long id) {
        SubscriptionPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found: " + id));
        pkg.setActive(!pkg.isActive());
        return packageRepository.save(pkg);
    }

    public void deletePackage(Long id) {
        packageRepository.deleteById(id);
    }

    // ── Subscription Operations ──────────────────────────────────────────────

    @Transactional
    public OrganizationSubscription subscribeOrganization(Long orgId, Long packageId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + orgId));
        SubscriptionPackage pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found: " + packageId));

        if (!pkg.isActive()) {
            throw new BadRequestException("Cannot subscribe to an inactive package.");
        }

        // Calculate end date based on package duration
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = now.plusDays(pkg.getDurationDays());

        // Deactivate existing active subscriptions and carry forward active duration
        Optional<OrganizationSubscription> currentOpt = subscriptionRepository.findFirstByOrganizationIdOrderByEndDateDesc(orgId);
        if (currentOpt.isPresent()) {
            OrganizationSubscription current = currentOpt.get();
            if ("ACTIVE".equalsIgnoreCase(current.getStatus())) {
                if (current.getEndDate() != null && current.getEndDate().isAfter(now)) {
                    endDate = current.getEndDate().plusDays(pkg.getDurationDays());
                }
                current.setStatus("EXPIRED");
                subscriptionRepository.save(current);
            }
        }

        OrganizationSubscription subscription = OrganizationSubscription.builder()
                .organizationId(orgId)
                .subscriptionPackage(pkg)
                .startDate(now)
                .endDate(endDate)
                .status("ACTIVE")
                .alert10DaysSent(false)
                .alert3DaysSent(false)
                .alert1DaySent(false)
                .build();

        OrganizationSubscription saved = subscriptionRepository.save(subscription);

        // Send confirmation alerts
        sendSubscriptionConfirmation(org, pkg, saved);

        return saved;
    }

    public OrganizationSubscription getActiveSubscription(Long orgId) {
        return subscriptionRepository.findFirstByOrganizationIdOrderByEndDateDesc(orgId)
                .orElse(null);
    }

    public List<OrganizationSubscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    // ── Scheduling & Expiry Alerts ───────────────────────────────────────────

    @Scheduled(cron = "0 0 8 * * ?") // Runs every day at 8:00 AM
    @Transactional
    public void checkSubscriptionsAndSendAlerts() {
        log.info("Checking organization subscriptions for expiry warnings...");
        List<OrganizationSubscription> activeSubs = subscriptionRepository.findByStatus("ACTIVE");
        LocalDateTime now = LocalDateTime.now();

        for (OrganizationSubscription sub : activeSubs) {
            long daysRemaining = ChronoUnit.DAYS.between(now, sub.getEndDate());
            Organization org = organizationRepository.findById(sub.getOrganizationId()).orElse(null);
            if (org == null) continue;

            // Resolve super admin
            List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(org.getId());
            Admin superAdmin = superAdmins.isEmpty() ? null : superAdmins.get(0);
            List<String> usaEmails = usaRepository.findAll().stream()
                    .map(UltraSuperAdmin::getEmail)
                    .collect(Collectors.toList());

            // 1. Expiration (<= 0 days)
            if (daysRemaining <= 0) {
                sub.setStatus("EXPIRED");
                subscriptionRepository.save(sub);
                notifyExpired(org, sub, superAdmin, usaEmails);
                continue;
            }

            // 2. 1 Day Before Pop Alert Notification (daysRemaining <= 1)
            if (daysRemaining <= 1 && !sub.isAlert1DaySent()) {
                sub.setAlert1DaySent(true);
                subscriptionRepository.save(sub);
                send1DayAlert(org, sub, superAdmin, usaEmails, (int) daysRemaining);
                continue;
            }

            // 3. 3 Days Before Email Alert (daysRemaining <= 3)
            if (daysRemaining <= 3 && !sub.isAlert3DaysSent()) {
                sub.setAlert3DaysSent(true);
                subscriptionRepository.save(sub);
                send3DayEmail(org, sub, superAdmin, usaEmails, (int) daysRemaining);
                continue;
            }

            // 4. 10 Days Before In-App Alert (daysRemaining <= 10)
            if (daysRemaining <= 10 && !sub.isAlert10DaysSent()) {
                sub.setAlert10DaysSent(true);
                subscriptionRepository.save(sub);
                send10DayInAppAlert(org, sub, superAdmin, usaEmails, (int) daysRemaining);
            }
        }
    }

    // ── Helper Notification Senders ──────────────────────────────────────────

    private void sendSubscriptionConfirmation(Organization org, SubscriptionPackage pkg, OrganizationSubscription sub) {
        String title = "💎 Subscription Activated";
        String message = String.format("Subscription Plan '%s' (%s) has been successfully activated for organization '%s'. Valid until %s.",
                pkg.getName(), pkg.getPackageType(), org.getName(), sub.getEndDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

        // Notify Super Admin
        List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(org.getId());
        if (!superAdmins.isEmpty()) {
            Admin sa = superAdmins.get(0);
            saveNotif(sa.getEmail(), title, message, Notification.NotificationType.SUCCESS);
            emailService.send(sa.getEmail(), title, emailService.subscriptionExpiryEmail(
                    org.getName(), pkg.getName(), pkg.getDurationDays(), sub.getEndDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
            ).replace("expiring soon", "activated successfully"));
        }

        // Notify Ultra Super Admins
        List<UltraSuperAdmin> usas = usaRepository.findAll();
        for (UltraSuperAdmin usa : usas) {
            saveNotif(usa.getEmail(), title, message, Notification.NotificationType.SUCCESS);
        }
    }

    private void send10DayInAppAlert(Organization org, OrganizationSubscription sub, Admin superAdmin, List<String> usaEmails, int daysRemaining) {
        String title = "⚠️ Plan Expiring Soon";
        String message = String.format("The subscription for '%s' (%s plan) expires in %d days (%s).",
                org.getName(), sub.getSubscriptionPackage().getName(), daysRemaining,
                sub.getEndDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

        if (superAdmin != null) {
            saveNotif(superAdmin.getEmail(), title, message, Notification.NotificationType.WARNING);
        }
        for (String email : usaEmails) {
            saveNotif(email, title, message, Notification.NotificationType.WARNING);
        }
        log.info("Sent 10-day subscription alert for organization {}", org.getName());
    }

    private void send3DayEmail(Organization org, OrganizationSubscription sub, Admin superAdmin, List<String> usaEmails, int daysRemaining) {
        String subject = "⚠️ CRITICAL: Subscription Expiring Soon - " + org.getName();
        String expiryDateStr = sub.getEndDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String html = emailService.subscriptionExpiryEmail(
                org.getName(), sub.getSubscriptionPackage().getName(), daysRemaining, expiryDateStr
        );

        // Send Email to Super Admin
        if (superAdmin != null) {
            saveNotif(superAdmin.getEmail(), "⚠️ Email Alert: Subscription Expiring",
                    "A critical email alert was sent regarding plan expiration.", Notification.NotificationType.WARNING);
            emailService.send(superAdmin.getEmail(), subject, html);
        }

        // Send Email to Ultra Super Admins
        for (String email : usaEmails) {
            saveNotif(email, "⚠️ Email Alert: Subscription Expiring - " + org.getName(),
                    "An email alert was sent for organization plan expiration.", Notification.NotificationType.WARNING);
            emailService.send(email, subject, html);
        }
        log.info("Sent 3-day subscription warning email for organization {}", org.getName());
    }

    private void send1DayAlert(Organization org, OrganizationSubscription sub, Admin superAdmin, List<String> usaEmails, int daysRemaining) {
        // High priority POP_ALERT title for the frontend to recognize and show pop alert modal
        String title = "POP_ALERT: Plan Expires Tomorrow";
        String message = String.format("CRITICAL: The subscription for organization '%s' expires TOMORROW! Plan details: %s.",
                org.getName(), sub.getSubscriptionPackage().getName().toUpperCase());

        if (superAdmin != null) {
            saveNotif(superAdmin.getEmail(), title, message, Notification.NotificationType.ERROR);
        }
        for (String email : usaEmails) {
            saveNotif(email, title, message, Notification.NotificationType.ERROR);
        }
        log.info("Sent 1-day subscription pop alert notification for organization {}", org.getName());
    }

    private void notifyExpired(Organization org, OrganizationSubscription sub, Admin superAdmin, List<String> usaEmails) {
        String title = "❌ Plan Expired";
        String message = String.format("The subscription for organization '%s' has expired. Access to restricted features will be disabled.",
                org.getName());

        if (superAdmin != null) {
            saveNotif(superAdmin.getEmail(), title, message, Notification.NotificationType.ERROR);
        }
        for (String email : usaEmails) {
            saveNotif(email, title, message, Notification.NotificationType.ERROR);
        }
        log.info("Subscription marked EXPIRED for organization {}", org.getName());
    }

    private void saveNotif(String email, String title, String msg, Notification.NotificationType type) {
        notificationRepository.save(Notification.builder()
                .recipientEmail(email)
                .title(title)
                .message(msg)
                .type(type)
                .read(false)
                .build());
    }

    // ── Revenue Analysis & Predictions ───────────────────────────────────────

    public java.util.Map<String, Object> getRevenueAnalysis() {
        List<OrganizationSubscription> allSubs = subscriptionRepository.findAll();
        double totalRevenue = 0;
        int activeSubsCount = 0;
        double mrr = 0;
        
        java.util.Map<String, Double> monthlyRevenue = new java.util.TreeMap<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (OrganizationSubscription sub : allSubs) {
            SubscriptionPackage pkg = sub.getSubscriptionPackage();
            if (pkg != null) {
                totalRevenue += pkg.getPrice();
                
                if ("ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                    activeSubsCount++;
                    if ("MONTHLY".equalsIgnoreCase(pkg.getPackageType())) {
                        mrr += pkg.getPrice();
                    } else if ("YEARLY".equalsIgnoreCase(pkg.getPackageType())) {
                        mrr += (pkg.getPrice() / 12.0);
                    }
                }
                
                LocalDateTime date = sub.getCreatedAt() != null ? sub.getCreatedAt() : sub.getStartDate();
                if (date != null) {
                    String monthKey = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                    monthlyRevenue.put(monthKey, monthlyRevenue.getOrDefault(monthKey, 0.0) + pkg.getPrice());
                }
            }
        }
        
        double arr = mrr * 12.0;
        
        double avgHistoricalGrowthRate = 0.10;
        if (monthlyRevenue.size() >= 2) {
            List<Double> revenues = new java.util.ArrayList<>(monthlyRevenue.values());
            double totalMoMGrowth = 0;
            int counts = 0;
            for (int i = 1; i < revenues.size(); i++) {
                double prev = revenues.get(i-1);
                double curr = revenues.get(i);
                if (prev > 0) {
                    totalMoMGrowth += (curr - prev) / prev;
                    counts++;
                }
            }
            if (counts > 0) {
                avgHistoricalGrowthRate = totalMoMGrowth / counts;
            }
        }
        
        List<java.util.Map<String, Object>> predictions = new java.util.ArrayList<>();
        double currentPredictMRR = mrr;
        double currentPredictCumulative = totalRevenue;
        double growthRate = avgHistoricalGrowthRate > 0 ? avgHistoricalGrowthRate : 0.10;
        
        for (int i = 1; i <= 6; i++) {
            LocalDateTime futureDate = now.plusMonths(i);
            String label = futureDate.format(DateTimeFormatter.ofPattern("MMM yyyy"));
            currentPredictMRR = currentPredictMRR * (1.0 + growthRate);
            currentPredictCumulative += currentPredictMRR;
            
            java.util.Map<String, Object> pred = new java.util.HashMap<>();
            pred.put("month", label);
            pred.put("predictedMRR", currentPredictMRR);
            pred.put("predictedCumulative", currentPredictCumulative);
            pred.put("growthRate", growthRate);
            predictions.add(pred);
        }
        
        java.util.Map<String, Object> analysis = new java.util.HashMap<>();
        analysis.put("totalRevenue", totalRevenue);
        analysis.put("activeSubscriptionsCount", activeSubsCount);
        analysis.put("mrr", mrr);
        analysis.put("arr", arr);
        analysis.put("historicalRevenue", monthlyRevenue);
        analysis.put("avgHistoricalGrowthRate", avgHistoricalGrowthRate);
        analysis.put("predictions", predictions);
        
        return analysis;
    }

    // ── Expiry Scanning & Reminders ──────────────────────────────────────────

    public void manualCheckExpiry() {
        checkSubscriptionsAndSendAlerts();
    }

    @Transactional
    public void sendManualReminder(Long subscriptionId) {
        OrganizationSubscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found: " + subscriptionId));
        Organization org = organizationRepository.findById(sub.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + sub.getOrganizationId()));
        
        List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(org.getId());
        Admin superAdmin = superAdmins.isEmpty() ? null : superAdmins.get(0);
        
        if (superAdmin == null) {
            throw new BadRequestException("No Super Admin found for organization: " + org.getName());
        }
        
        long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), sub.getEndDate());
        String subject = "⚠️ Subscription Renewal Reminder - " + org.getName();
        String expiryDateStr = sub.getEndDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String html = emailService.subscriptionExpiryEmail(
                org.getName(), sub.getSubscriptionPackage().getName(), (int) daysRemaining, expiryDateStr
        );
        
        emailService.send(superAdmin.getEmail(), subject, html);
        
        saveNotif(superAdmin.getEmail(), "⚠️ Manual Alert: Subscription Expiring",
                "A manual renewal email reminder was sent by the platform administrator.", Notification.NotificationType.WARNING);
        
        List<UltraSuperAdmin> usas = usaRepository.findAll();
        for (UltraSuperAdmin usa : usas) {
            saveNotif(usa.getEmail(), "⚠️ Manual Alert: Sent Reminder to " + org.getName(),
                    "Sent a manual renewal reminder email to organization Super Admin.", Notification.NotificationType.WARNING);
        }
    }
}
