// src/main/java/com/zenelait/lms/scheduler/BatchStatusScheduler.java

package com.zenelait.lms.scheduler;
 
import com.zenelait.lms.entity.Batch;
import com.zenelait.lms.entity.Course;
import com.zenelait.lms.repository.BatchRepository;
import com.zenelait.lms.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
 
import java.time.LocalDate;
import java.util.List;
 
@Component
@RequiredArgsConstructor
@Slf4j
public class BatchStatusScheduler {
 
    private final BatchRepository batchRepository;
    private final CourseRepository courseRepository;
 
    /**
     * Runs every day at midnight AND once on startup (after 5 seconds).
     *
     * Status logic:
     *   startDate > today              → Batch=UPCOMING,   Course=DRAFT
     *   startDate <= today <= endDate  → Batch=ACTIVE,     Course=ACTIVE
     *   endDate   < today              → Batch=COMPLETED,  Course=INACTIVE
     */
    @Transactional
    @Scheduled(cron = "0 0 0 * * *")
    public void updateBatchAndCourseStatuses() {
        runStatusUpdate();
    }
 
    // Also run once 5 seconds after server starts — fixes existing null-status rows immediately
    @Transactional
    @Scheduled(initialDelay = 5000, fixedDelay = Long.MAX_VALUE)
    public void runOnStartup() {
        log.info("Running status sync on startup...");
        runStatusUpdate();
    }
 
    private void runStatusUpdate() {
        LocalDate today = LocalDate.now();
        int batchesUpdated = 0;
        int coursesUpdated = 0;
 
        // ── Step 1: Update Batch statuses & cascade to linked Course ─────────
        List<Batch> allBatches = batchRepository.findAll();
        for (Batch batch : allBatches) {
            if (batch.getStartDate() == null || batch.getEndDate() == null) continue;
 
            // Calculate new batch status
            Batch.BatchStatus newBatchStatus;
            if (today.isBefore(batch.getStartDate())) {
                newBatchStatus = Batch.BatchStatus.UPCOMING;
            } else if (today.isAfter(batch.getEndDate())) {
                newBatchStatus = Batch.BatchStatus.COMPLETED;
            } else {
                newBatchStatus = Batch.BatchStatus.ACTIVE;
            }
 
            if (batch.getStatus() != newBatchStatus) {
                log.info("Batch '{}': {} → {}", batch.getName(), batch.getStatus(), newBatchStatus);
                batch.setStatus(newBatchStatus);
                batchRepository.save(batch);
                batchesUpdated++;
            }
 
            // Cascade same date logic to the course assigned to this batch
            Course course = batch.getCourse();
            if (course == null) continue;
 
            Course.CourseStatus newCourseStatus;
            if (today.isBefore(batch.getStartDate())) {
                newCourseStatus = Course.CourseStatus.DRAFT;
            } else if (today.isAfter(batch.getEndDate())) {
                newCourseStatus = Course.CourseStatus.INACTIVE;
            } else {
                newCourseStatus = Course.CourseStatus.ACTIVE;
            }
 
            if (course.getStatus() == null || course.getStatus() != newCourseStatus) {
                log.info("Course '{}': {} → {} (batch '{}')",
                        course.getTitle(), course.getStatus(), newCourseStatus, batch.getName());
                course.setStatus(newCourseStatus);
                courseRepository.save(course);
                coursesUpdated++;
            }
        }
 
        // ── Step 2: Fix any orphan courses with null status (no batch assigned) ─
        courseRepository.findAll().stream()
                .filter(c -> c.getStatus() == null)
                .forEach(c -> {
                    c.setStatus(Course.CourseStatus.DRAFT);
                    courseRepository.save(c);
                    log.info("Course '{}' had null status — defaulted to DRAFT", c.getTitle());
                });
 
        log.info("Status sync done — {} batches updated, {} courses updated", batchesUpdated, coursesUpdated);
    }
}