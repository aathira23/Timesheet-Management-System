package com.tms.timesheet_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tms.timesheet_management.dto.ApiResponse;
import com.tms.timesheet_management.dto.DepartmentDTO;
import com.tms.timesheet_management.model.Department;
import com.tms.timesheet_management.repository.DepartmentRepository;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getAllDepartments() {
        List<Department> departments = departmentRepository.findAll();
        List<DepartmentDTO> departmentDTOs = departments.stream().map(dept -> new DepartmentDTO(
            dept.getId(),
            dept.getName(),
            dept.getDescription(),
            dept.getManager() != null ? dept.getManager().getId() : null
        )).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, "Departments fetched successfully", departmentDTOs));
    }
}