package com.tms.timesheet_management.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.tms.timesheet_management.dto.ProjectAssignmentDTO;
import com.tms.timesheet_management.exception.BadRequestException;
import com.tms.timesheet_management.exception.NotFoundException;
import com.tms.timesheet_management.model.Project;
import com.tms.timesheet_management.model.ProjectAssignment;
import com.tms.timesheet_management.model.User;
import com.tms.timesheet_management.repository.ProjectAssignmentRepository;
import com.tms.timesheet_management.repository.ProjectRepository;
import com.tms.timesheet_management.repository.UserRepository;

@Service
public class ProjectAssignmentService {

    @Autowired
    private ProjectAssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    // ✅ Create assignment from DTO with department check
    public ProjectAssignmentDTO createAssignment(ProjectAssignmentDTO dto) {

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found"));

        // Get currently logged-in manager
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("Logged-in manager not found"));

        // Department checks
        if (!"ROLE_MANAGER".equals(manager.getRole().getName())) {
            throw new BadRequestException("Only managers can assign projects");
        }
        if (!user.getDepartment().getId().equals(manager.getDepartment().getId())) {
            throw new BadRequestException("Cannot assign project to user outside your department");
        }
        if (!project.getDepartment().getId().equals(manager.getDepartment().getId())) {
            throw new BadRequestException("Cannot assign project outside your department");
        }

        // Check if assignment already exists
        if (assignmentRepository.findByUserAndProject(user, project).isPresent()) {
            throw new BadRequestException("Assignment already exists for this user and project");
        }

        ProjectAssignment assignment = new ProjectAssignment();
        assignment.setUser(user);
        assignment.setProject(project);
        assignment.setRoleInProject(dto.getRoleInProject());

        ProjectAssignment saved = assignmentRepository.save(assignment);

        return convertToDTO(saved);
    }

    // ✅ Get all assignments
    public List<ProjectAssignmentDTO> getAllAssignments() {
        return assignmentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ Get assignment by ID
    public ProjectAssignmentDTO getAssignmentById(Long id) {
        ProjectAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        return convertToDTO(assignment);
    }

    // ✅ Update assignment by ID with department check
    public ProjectAssignmentDTO updateAssignment(Long id, ProjectAssignmentDTO dto) {

        ProjectAssignment existing = assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found"));

        // Get currently logged-in manager
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("Logged-in manager not found"));

        // Department checks
        if (!"ROLE_MANAGER".equals(manager.getRole().getName())) {
            throw new BadRequestException("Only managers can update assignments");
        }
        if (!user.getDepartment().getId().equals(manager.getDepartment().getId())) {
            throw new BadRequestException("Cannot assign project to user outside your department");
        }
        if (!project.getDepartment().getId().equals(manager.getDepartment().getId())) {
            throw new BadRequestException("Cannot assign project outside your department");
        }

        // Check if another assignment exists for same user+project
        assignmentRepository.findByUserAndProject(user, project)
                .ifPresent(a -> {
                    if (!a.getId().equals(id)) {
                        throw new BadRequestException("Another assignment already exists for this user and project");
                    }
                });

        existing.setUser(user);
        existing.setProject(project);
        existing.setRoleInProject(dto.getRoleInProject());

        ProjectAssignment updated = assignmentRepository.save(existing);

        return convertToDTO(updated);
    }

    // ✅ Delete assignment by ID
    public void deleteAssignment(Long id) {
        ProjectAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        assignmentRepository.delete(assignment);
    }

    // ✅ Convert Entity -> DTO (includes optional fields for frontend)
    public ProjectAssignmentDTO convertToDTO(ProjectAssignment assignment) {
        ProjectAssignmentDTO dto = new ProjectAssignmentDTO();
        dto.setId(assignment.getId());
        dto.setUserId(assignment.getUser().getId());
        dto.setProjectId(assignment.getProject().getId());
        dto.setRoleInProject(assignment.getRoleInProject());
        // Optional fields for easier frontend display
        dto.setUserName(assignment.getUser().getName());
        dto.setProjectName(assignment.getProject().getName());
        return dto;
    }
}
