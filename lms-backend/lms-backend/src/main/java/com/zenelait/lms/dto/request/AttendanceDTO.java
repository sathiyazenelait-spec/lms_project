package com.zenelait.lms.dto.request;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;

public class AttendanceDTO {
    private Long id;
    private String courseName;
    private LocalDate date;
    private String status;
    private String remarks;

    // Constructor
    public AttendanceDTO(Long id, String courseName, LocalDate date, String status, String remarks) {
        this.id = id;
        this.courseName = courseName;
        this.date = date;
        this.status = status;
        this.remarks = remarks;
    }

    // Getters & setters
    public Long getId() { return id; }
    public String getCourseName() { return courseName; }
    public LocalDate getDate() { return date; }
    public String getStatus() { return status; }
    public String getRemarks() { return remarks; }

    public void setId(Long id) { this.id = id; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setStatus(String status) { this.status = status; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
