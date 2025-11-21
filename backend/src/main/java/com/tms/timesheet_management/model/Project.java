package com.tms.timesheet_management.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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
    @JoinColumn(name = "department_id", nullable = false)
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


    @ManyToOne
    @JoinColumn(name = "manager_id")
    @JsonIgnore
    private User manager;

    // Assigned users for this project
    @ManyToMany(cascade = { jakarta.persistence.CascadeType.PERSIST, jakarta.persistence.CascadeType.MERGE })
    @JoinTable(
        name = "project_assignments",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private java.util.Set<User> assignedUsers = new java.util.HashSet<>();
}
