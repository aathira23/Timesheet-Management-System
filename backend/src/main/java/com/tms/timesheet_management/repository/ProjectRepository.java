package com.tms.timesheet_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tms.timesheet_management.model.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Count projects for a specific manager
    int countByManager_Id(Long managerId);

    // Optional: get all projects for a manager
    List<Project> findAllByManager_Id(Long managerId);
}
