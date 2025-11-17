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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "department_id",nullable= false)
    @JsonIgnore
    private Department department;

    @NotBlank(message = "Project name is required")
    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @NotNull(message = "Project start date is required")
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull(message = "Project end date is required")
    @Column(nullable = false)
    private LocalDate endDate;

    @NotBlank(message = "Project status is required")
    @Column(nullable = false)
    private String status; // Example: "ACTIVE", "COMPLETED", "ON_HOLD"
}
