package com.zenelait.lms.service.notification;

import com.zenelait.lms.entity.*;
import com.zenelait.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceNotificationScheduler {

    private final CourseRepository courseRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final LeaveDayRepository leaveDayRepository;
    private final AttendanceRepository attendanceRepository;
    private final NotificationService notificationService;
    private final AdminRepository adminRepository;

    // Run every day at 6:00 PM (18:00)
    @Scheduled(cron = "0 0 18 * * *")
    public void checkMissingAttendanceDaily() {
        log.info("Starting daily missing attendance check...");
        performCheck(LocalDate.now());
    }

    public void performCheck(LocalDate date) {
        // Sunday is always a leave day
        if (date.getDayOfWeek().getValue() == 7) {
            log.info("Today is Sunday. Skipping attendance check.");
            return;
        }

        // If today is a configured admin leave day, skip
        if (leaveDayRepository.findByDate(date).isPresent()) {
            log.info("Today is an assigned leave day. Skipping attendance check.");
            return;
        }

        String dayOfWeekStr = date.getDayOfWeek().name();

        List<Course> activeCourses = courseRepository.findByStatus(Course.CourseStatus.ACTIVE);

        for (Course course : activeCourses) {
            List<TimetableSlot> slots = timetableSlotRepository.findByCourse(course);
            boolean isScheduledToday = slots.stream()
                    .anyMatch(slot -> slot.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr));

            if (isScheduledToday) {
                List<Attendance> records = attendanceRepository.findByCourseAndDate(course, date);
                if (records.isEmpty()) {
                    log.warn("Missing attendance detected for course: {} on date: {}", course.getTitle(), date);
                    
                    // Retrieve admin emails for the course organization
                    List<String> adminEmails = adminRepository.findAll().stream()
                            .filter(a -> course.getOrganizationId() == null || course.getOrganizationId().equals(a.getOrganizationId()))
                            .map(Admin::getEmail)
                            .toList();

                    if (!adminEmails.isEmpty()) {
                        notificationService.sendMissingAttendanceAlert(course, date, adminEmails);
                    }
                }
            }
        }
    }
}
