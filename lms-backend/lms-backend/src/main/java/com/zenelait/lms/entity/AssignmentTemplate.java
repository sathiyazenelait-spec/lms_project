package com.zenelait.lms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assignment_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    private String taskType; // Homework, Project, Lab, etc.
    private Integer maxMarks;
    private String submissionType; // TEXT, FILE, LINK, ANY
}
