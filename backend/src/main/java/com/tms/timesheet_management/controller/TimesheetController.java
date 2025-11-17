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
        dto.setProjectId(timesheet.getProject().getId());
        dto.setWorkDate(timesheet.getWorkDate());
        dto.setHoursWorked(timesheet.getHoursWorked());
        dto.setApprovalStatus(timesheet.getApprovalStatus());
        return dto;
    }

    // Employee creates timesheet
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<TimesheetDTO>> createTimesheet(@Valid @RequestBody TimesheetDTO dto) {
        Timesheet timesheet = new Timesheet();
        User user = new User();
        user.setId(dto.getUserId());
        timesheet.setUser(user);

        Project project = new Project();
        project.setId(dto.getProjectId());
        timesheet.setProject(project);

        timesheet.setWorkDate(dto.getWorkDate());
        timesheet.setHoursWorked(dto.getHoursWorked());

        Timesheet saved = timesheetService.createTimesheet(timesheet);
        return ResponseEntity.ok(new ApiResponse<>(true, "Timesheet created successfully", convertToDTO(saved)));
    }

    // Get all timesheets
    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<TimesheetDTO>>> getAllTimesheets() {
        List<TimesheetDTO> dtos = timesheetService.getAllTimesheets()
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
}
