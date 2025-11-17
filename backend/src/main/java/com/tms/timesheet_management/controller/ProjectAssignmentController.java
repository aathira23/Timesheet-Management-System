package com.tms.timesheet_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.web.bind.annotation.RestController;

import com.tms.timesheet_management.dto.ApiResponse;
import com.tms.timesheet_management.dto.ProjectAssignmentDTO;
import com.tms.timesheet_management.service.ProjectAssignmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/project_assignments")
@CrossOrigin(origins = "*")
public class ProjectAssignmentController {

    @Autowired
    private ProjectAssignmentService assignmentService;

    // ✅ Create assignment
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectAssignmentDTO>> createAssignment(@Valid @RequestBody ProjectAssignmentDTO dto) {
        ProjectAssignmentDTO saved = assignmentService.createAssignment(dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignment created successfully", saved));
    }

    // ✅ Get all assignments
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectAssignmentDTO>>> getAllAssignments() {
        List<ProjectAssignmentDTO> list = assignmentService.getAllAssignments();
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignments fetched successfully", list));
    }

    // ✅ Get assignment by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getAssignmentById(@PathVariable Long id) {
                ProjectAssignmentDTO dto = assignmentService.getAssignmentById(id);
                return ResponseEntity.ok(new ApiResponse<>(true, "Assignment fetched successfully", dto));
   }

    // ✅ Update assignment
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectAssignmentDTO>> updateAssignment(@PathVariable Long id,
            @Valid @RequestBody ProjectAssignmentDTO dto) {
        ProjectAssignmentDTO updated = assignmentService.updateAssignment(id, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignment updated successfully", updated));
    }

    // ✅ Delete assignment by ID
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<String>> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignment deleted successfully", null));
    }
}

