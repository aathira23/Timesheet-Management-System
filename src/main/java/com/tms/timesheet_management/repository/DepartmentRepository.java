package com.tms.timesheet_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tms.timesheet_management.model.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);

    // Find departments by manager id (if any)
    List<Department> findByManager_Id(Long managerId);
}
