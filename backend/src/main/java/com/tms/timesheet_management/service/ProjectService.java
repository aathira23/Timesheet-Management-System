package com.tms.timesheet_management.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.tms.timesheet_management.dto.ProjectDTO;
import com.tms.timesheet_management.dto.ProjectResponseDTO;
import com.tms.timesheet_management.exception.BadRequestException;
import com.tms.timesheet_management.exception.NotFoundException;
import com.tms.timesheet_management.model.Department;
import com.tms.timesheet_management.model.Project;
import com.tms.timesheet_management.model.User;
import com.tms.timesheet_management.repository.DepartmentRepository;
import com.tms.timesheet_management.repository.ProjectRepository;
import com.tms.timesheet_management.repository.UserRepository;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    // ========================
    // Create Project
    // ========================
    public Project createProject(ProjectDTO dto) {
        if (dto.getName() == null || dto.getName().isEmpty())
            throw new BadRequestException("Project name is required");

        // Get currently logged-in manager
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("Logged-in user not found"));

        if (!"ROLE_MANAGER".equals(manager.getRole().getName())) {
            throw new BadRequestException("Only managers can create projects");
        }

        // Check department
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found"));

        if (!dept.getId().equals(manager.getDepartment().getId())) {
            throw new BadRequestException("Manager can create project only for their own department");
        }

        // Map DTO → Project
        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        project.setDepartment(dept);

        return projectRepository.save(project);
    }

    // ========================
    // Get all projects
    // ========================
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // ========================
    // Get project by ID
    // ========================
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project with ID " + id + " not found"));
    }

    // ========================
    // Update Project
    // ========================
    public Project updateProject(Long id, ProjectDTO dto) {
        Project project = getProjectById(id);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("Logged-in user not found"));

        if (!"ROLE_MANAGER".equals(manager.getRole().getName()) ||
            !project.getDepartment().getId().equals(manager.getDepartment().getId())) {
            throw new BadRequestException("Only manager of this department can update project");
        }

        if (dto.getName() != null) project.setName(dto.getName());
        if (dto.getDescription() != null) project.setDescription(dto.getDescription());
        if (dto.getStartDate() != null) project.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) project.setEndDate(dto.getEndDate());
        if (dto.getStatus() != null) project.setStatus(dto.getStatus());

        return projectRepository.save(project);
    }

    // ========================
    // Delete Project
    // ========================
    public void deleteProject(Long id) {
        Project project = getProjectById(id);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("Logged-in user not found"));

        if (!"ROLE_MANAGER".equals(manager.getRole().getName()) ||
            !project.getDepartment().getId().equals(manager.getDepartment().getId())) {
            throw new BadRequestException("Only manager of this department can delete project");
        }

        projectRepository.delete(project);
    }

    public ProjectResponseDTO toResponseDTO(Project project) {
    ProjectResponseDTO dto = new ProjectResponseDTO();
    dto.setId(project.getId());
    dto.setName(project.getName());
    dto.setDescription(project.getDescription());
    dto.setStatus(project.getStatus());
    dto.setStartDate(project.getStartDate());
    dto.setEndDate(project.getEndDate());
    dto.setDepartmentName(project.getDepartment() != null ? project.getDepartment().getName() : null);
    return dto;
}

}
