package com.tms.timesheet_management.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tms.timesheet_management.dto.ApiResponse;
import com.tms.timesheet_management.dto.TimesheetDTO;
import com.tms.timesheet_management.model.Project;
import com.tms.timesheet_management.model.Timesheet;
import com.tms.timesheet_management.model.User;
import com.tms.timesheet_management.service.TimesheetService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/timesheets")
@CrossOrigin(origins = "*")
@Tag(name = "Timesheets", description = "Operations related to timesheets")
public class TimesheetController {

    @Autowired
    private TimesheetService timesheetService;

    private TimesheetDTO convertToDTO(Timesheet timesheet) {
        TimesheetDTO dto = new TimesheetDTO();
        dto.setId(timesheet.getId());
        dto.setUserId(timesheet.getUser().getId());
        dto.setUserName(timesheet.getUser().getName());
        if (timesheet.getProject() != null) {
            dto.setProjectId(timesheet.getProject().getId());
            dto.setProjectName(timesheet.getProject().getName());
        } else {
            dto.setProjectId(null);
            dto.setProjectName(timesheet.getActivityType() != null ? "Internal: " + timesheet.getActivityType() : null);
        }
        dto.setDescription(timesheet.getDescription()); // Use timesheet description, not project
        dto.setWorkDate(timesheet.getWorkDate());
        dto.setHoursWorked(timesheet.getHoursWorked());
        dto.setApprovalStatus(timesheet.getApprovalStatus());
        dto.setActivityType(timesheet.getActivityType());
        return dto;
    }

    // Employee creates timesheet
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Create a new timesheet for current employee")
    public ResponseEntity<ApiResponse<TimesheetDTO>> createTimesheet(@Valid @RequestBody TimesheetDTO dto) {
        Timesheet timesheet = new Timesheet();
        
        // Get current authenticated user
        String principalEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.tms.timesheet_management.model.User user = timesheetService.getUserByEmail(principalEmail);
        timesheet.setUser(user);

        if (dto.getProjectId() != null && dto.getProjectId() != 0L) {
            Project project = new Project();
            project.setId(dto.getProjectId());
            timesheet.setProject(project);
        } else {
            // activity-only timesheet
            timesheet.setProject(null);
            timesheet.setActivityType(dto.getActivityType());
        }

        timesheet.setWorkDate(dto.getWorkDate());
        timesheet.setHoursWorked(dto.getHoursWorked());
        timesheet.setDescription(dto.getDescription());
        // Also set activityType from DTO if provided
        if (dto.getActivityType() != null && !dto.getActivityType().isBlank()) {
            timesheet.setActivityType(dto.getActivityType());
        }

        Timesheet saved = timesheetService.createTimesheet(timesheet);
        return ResponseEntity.ok(new ApiResponse<>(true, "Timesheet created successfully", convertToDTO(saved)));
    }

    // Get all timesheets (only current employee's timesheets)
    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get all timesheets for current employee")
    public ResponseEntity<ApiResponse<List<TimesheetDTO>>> getAllTimesheets() {
        String principalEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.tms.timesheet_management.model.User user = timesheetService.getUserByEmail(principalEmail);
        List<TimesheetDTO> dtos = timesheetService.getTimesheetsByUser(user)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true,
                dtos.isEmpty() ? "No timesheets found" : "Timesheets fetched successfully", dtos));
    }

    // Get single timesheet
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TimesheetDTO>> getTimesheetById(@PathVariable Long id) {
        Timesheet timesheet = timesheetService.getTimesheetById(id)
                .orElseThrow(() -> new com.tms.timesheet_management.exception.NotFoundException("Timesheet with ID " + id + " not found"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Timesheet fetched successfully", convertToDTO(timesheet)));
    }

    // Update timesheet (only employee, only own, only pending)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<TimesheetDTO>> updateTimesheet(@PathVariable Long id,
                                                                     @Valid @RequestBody TimesheetDTO dto) {
        Timesheet timesheet = new Timesheet();
        timesheet.setWorkDate(dto.getWorkDate());
        timesheet.setHoursWorked(dto.getHoursWorked());
        timesheet.setDescription(dto.getDescription());

        Timesheet updated = timesheetService.updateTimesheet(id, timesheet);
        return ResponseEntity.ok(new ApiResponse<>(true, "Timesheet updated successfully", convertToDTO(updated)));
    }

    // Delete timesheet (only employee, only own, only pending)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<String>> deleteTimesheet(@PathVariable Long id) {
        timesheetService.deleteTimesheet(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Timesheet deleted successfully", null));
    }

    // Pending timesheets for employee
    @GetMapping("/pending/employee/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get pending timesheets for employee")
    public ResponseEntity<ApiResponse<List<TimesheetDTO>>> getPendingTimesheetsEmployee(@PathVariable Long id) {
        List<TimesheetDTO> dtos = timesheetService.getPendingTimesheetsForEmployee(id)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true,
                dtos.isEmpty() ? "Employee has no pending timesheets" : "Pending timesheets fetched successfully", dtos));
    }

    // Pending timesheets for manager
    @GetMapping("/pending/manager/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Get pending timesheets for manager approval")
    public ResponseEntity<ApiResponse<List<TimesheetDTO>>> getPendingTimesheetsManager(@PathVariable Long id) {
        List<TimesheetDTO> dtos = timesheetService.getPendingTimesheetsForManager(id)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true,
                dtos.isEmpty() ? "Manager has no pending timesheets" : "Pending timesheets fetched successfully", dtos));
    }

    // Get timesheets by date
    @GetMapping("/date")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get timesheets for a specific date (YYYY-MM-DD)")
    public ResponseEntity<ApiResponse<List<TimesheetDTO>>> getTimesheetsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TimesheetDTO> dtos = timesheetService.getTimesheetsByDate(date)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(!dtos.isEmpty(), 
                dtos.isEmpty() ? "No timesheets found for date " + date : "Timesheets fetched successfully", dtos));
    }

    // Get current employee's timesheet statistics
    @GetMapping("/me/stats")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get current employee's timesheet statistics")
    public ResponseEntity<ApiResponse<com.tms.timesheet_management.dto.TimesheetStatsDTO>> getCurrentEmployeeStats() {
        String principalEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User user = timesheetService.getUserByEmail(principalEmail);
        com.tms.timesheet_management.dto.TimesheetStatsDTO stats = timesheetService.getTimesheetStats(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Stats fetched successfully", stats));
    }

    // Get current employee's assigned projects
    @GetMapping("/me/projects")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get projects assigned to current employee")
    public ResponseEntity<ApiResponse<List<com.tms.timesheet_management.dto.ProjectSimpleDTO>>> getCurrentEmployeeProjects() {
        String principalEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User user = timesheetService.getUserByEmail(principalEmail);
        List<com.tms.timesheet_management.dto.ProjectSimpleDTO> projects = timesheetService.getAssignedProjects(user);
        return ResponseEntity.ok(new ApiResponse<>(true, 
                projects.isEmpty() ? "No projects assigned" : "Projects fetched successfully", projects));
    }

    // Manager dashboard stats (returns ManagerDashboardDTO)
    @GetMapping("/manager/{id}/dashboard-stats")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Get manager dashboard statistics")
    public ResponseEntity<ApiResponse<com.tms.timesheet_management.dto.ManagerDashboardDTO>> getManagerDashboardStats(@PathVariable Long id) {
        com.tms.timesheet_management.dto.ManagerDashboardDTO stats = timesheetService.getManagerDashboardStats(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Manager stats fetched successfully", stats));
    }

    // Manager stats for frontend (returns ManagerStatsDTO)
    @GetMapping("/manager/{id}/stats")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Get manager statistics")
    public ResponseEntity<ApiResponse<com.tms.timesheet_management.dto.ManagerStatsDTO>> getManagerStats(@PathVariable Long id) {
        try {
            com.tms.timesheet_management.dto.ManagerDashboardDTO dashboardStats = timesheetService.getManagerDashboardStats(id);
            com.tms.timesheet_management.dto.ManagerStatsDTO stats = com.tms.timesheet_management.dto.ManagerStatsDTO.builder()
                .teamCount(dashboardStats.getTeamCount())
                .projectsCount(dashboardStats.getProjectsCount())
                .approvalsActioned(dashboardStats.getApprovalsActioned())
                .pendingApprovals(dashboardStats.getPendingApprovals())
                .build();
            return ResponseEntity.ok(new ApiResponse<>(true, "Manager stats fetched successfully", stats));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Error fetching manager stats: " + e.getMessage(), null));
        }
    }
}
