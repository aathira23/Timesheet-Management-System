package com.tms.timesheet_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tms.timesheet_management.model.Project;
import com.tms.timesheet_management.model.ProjectAssignment;
import com.tms.timesheet_management.model.User;

public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {
    List<ProjectAssignment> findByUser(User user);
    List<ProjectAssignment> findByProject(Project project);
    Optional<ProjectAssignment> findByUserAndProject(User user, Project project);
    boolean existsByUserIdAndProjectId(Long userId, Long projectId);
}
