package com.tms.timesheet_management.dto;

import jakarta.validation.constraints.NotBlank;

public class DepartmentAdminDTO {

    @NotBlank(message = "Department name is required")
    private String name;

    private String description;

    // Optional: manager user id to assign as manager for this department
    private Long managerId;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
}
