package com.tms.timesheet_management.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "timesheets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Timesheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Employee who logged the timesheet
    @NotNull(message = "User is required")
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    // Project worked on (optional for activity-only timesheets)
    @ManyToOne
    @JoinColumn(name = "project_id", nullable = true)
    @JsonIgnore
    private Project project;

    // If logging an internal activity (training, meeting, admin), store the activity type here
    @Column(length = 100)
    private String activityType; // e.g. "training", "meeting", "admin", "other"

    @NotNull(message = "Work date is required")
    @Column(nullable = false)
    private LocalDate workDate;

    @NotNull(message = "Hours worked is required")
    @Min(value = 0, message = "Hours worked must be at least 0")
    @Column(nullable = false)
    private Double hoursWorked;

    @Column(length = 500)
    private String description; // Optional notes about the work

    @NotNull(message = "Approval status is required")
    @Column(nullable = false)
    private String approvalStatus; // "PENDING", "APPROVED", "REJECTED"
}
