package com.tms.timesheet_management.repository;

import com.tms.timesheet_management.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
