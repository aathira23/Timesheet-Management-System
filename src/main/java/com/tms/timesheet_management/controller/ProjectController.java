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
import com.tms.timesheet_management.dto.ProjectDTO;
import com.tms.timesheet_management.dto.ProjectResponseDTO;
import com.tms.timesheet_management.model.Project;
import com.tms.timesheet_management.service.ProjectService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
@Tag(name = "Projects", description = "Operations related to projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    // ========================
    // CREATE PROJECT
    // ========================
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Create new project (Manager only)")
    public ResponseEntity<ApiResponse<ProjectResponseDTO>> createProject(@Valid @RequestBody ProjectDTO dto) {
        Project saved = projectService.createProject(dto);
        ProjectResponseDTO response = projectService.toResponseDTO(saved);
        return ResponseEntity.ok(new ApiResponse<>(true, "Project created successfully", response));
    }

    // ========================
    // GET ALL PROJECTS
    // ========================
    @GetMapping
    @Operation(summary = "Get all projects")
    public ResponseEntity<ApiResponse<List<ProjectResponseDTO>>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        List<ProjectResponseDTO> responses = projects.stream()
                .map(projectService::toResponseDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(true, "Projects fetched successfully", responses));
    }

    // ========================
    // GET PROJECT BY ID
    // ========================
    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ApiResponse<ProjectResponseDTO>> getProjectById(@PathVariable Long id) {
        Project project = projectService.getProjectById(id);
        ProjectResponseDTO response = projectService.toResponseDTO(project);
        return ResponseEntity.ok(new ApiResponse<>(true, "Project fetched successfully", response));
    }

    // ========================
    // UPDATE PROJECT
    // ========================
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Update project (Manager only)")
    public ResponseEntity<ApiResponse<ProjectResponseDTO>> updateProject(@PathVariable Long id,
                                                                         @Valid @RequestBody ProjectDTO dto) {
        Project updated = projectService.updateProject(id, dto);
        ProjectResponseDTO response = projectService.toResponseDTO(updated);
        return ResponseEntity.ok(new ApiResponse<>(true, "Project updated successfully", response));
    }

    // ========================
    // DELETE PROJECT
    // ========================
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Delete project (Manager only)")
    public ResponseEntity<ApiResponse<String>> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Project deleted successfully", null));
    }
}
