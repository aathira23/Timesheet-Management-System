package com.tms.timesheet_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tms.timesheet_management.dto.DepartmentAdminDTO;
import com.tms.timesheet_management.dto.UserAdminDTO;
import com.tms.timesheet_management.dto.UserResponseDTO;
import com.tms.timesheet_management.model.Department;
import com.tms.timesheet_management.service.AdminService;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // ------------------------
    // USER ENDPOINTS
    // ------------------------

    // Create a new user
    @PostMapping("/users")
    public ResponseEntity<UserResponseDTO> createUser(@Validated @RequestBody UserAdminDTO dto) {
        UserResponseDTO createdUser = adminService.createUser(dto);
        return ResponseEntity.ok(createdUser);
    }

    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Get single user by ID
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        UserResponseDTO user = adminService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // Update user
    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id,
                                                      @Validated @RequestBody UserAdminDTO dto) {
        UserResponseDTO updatedUser = adminService.updateUser(id, dto);
        return ResponseEntity.ok(updatedUser);
    }

    // Delete user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ------------------------
    // DEPARTMENT ENDPOINTS
    // ------------------------

    // Create a department
    @PostMapping("/departments")
    public ResponseEntity<Department> createDepartment(@Validated @RequestBody DepartmentAdminDTO dto) {
        Department dept = adminService.createDepartment(dto);
        return ResponseEntity.ok(dept);
    }

    // Get all departments
    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        List<Department> departments = adminService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    // Get department by ID
    @GetMapping("/departments/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        Department dept = adminService.getDepartmentById(id);
        return ResponseEntity.ok(dept);
    }

    // Update department
    @PutMapping("/departments/{id}")
    public ResponseEntity<Department> updateDepartment(@PathVariable Long id,
                                                       @Validated @RequestBody DepartmentAdminDTO dto) {
        Department updatedDept = adminService.updateDepartment(id, dto);
        return ResponseEntity.ok(updatedDept);
    }

    // Delete department
    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        adminService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}
