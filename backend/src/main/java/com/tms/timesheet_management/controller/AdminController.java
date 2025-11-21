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
import com.tms.timesheet_management.dto.DepartmentResponseDTO;
import com.tms.timesheet_management.dto.UserAdminDTO;
import com.tms.timesheet_management.dto.UserResponseDTO;
import com.tms.timesheet_management.service.AdminService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // ------------------------
    // USER ENDPOINTS
    // ------------------------

    // Create a new user
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> createUser(@Validated @RequestBody UserAdminDTO dto) {
        UserResponseDTO createdUser = adminService.createUser(dto);
        return ResponseEntity.ok(createdUser);
    }

    // Get all users (allowed for ADMIN and MANAGER)
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Get single user by ID
    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        UserResponseDTO user = adminService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // Update user
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id,
                                                      @Validated @RequestBody UserAdminDTO dto) {
        UserResponseDTO updatedUser = adminService.updateUser(id, dto);
        return ResponseEntity.ok(updatedUser);
    }

    // Delete user
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ------------------------
    // DEPARTMENT ENDPOINTS
    // ------------------------

    // Create a department
    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentResponseDTO> createDepartment(@Validated @RequestBody DepartmentAdminDTO dto) {
        DepartmentResponseDTO dept = adminService.createDepartment(dto);
        return ResponseEntity.ok(dept);
    }

    // Get all departments
    @GetMapping("/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DepartmentResponseDTO>> getAllDepartments() {
        List<DepartmentResponseDTO> departments = adminService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    // Get department by ID
    @GetMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentResponseDTO> getDepartmentById(@PathVariable Long id) {
        DepartmentResponseDTO dept = adminService.getDepartmentById(id);
        return ResponseEntity.ok(dept);
    }

    // Update department
    @PutMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentResponseDTO> updateDepartment(@PathVariable Long id,
                                                       @Validated @RequestBody DepartmentAdminDTO dto) {
        DepartmentResponseDTO updatedDept = adminService.updateDepartment(id, dto);
        return ResponseEntity.ok(updatedDept);
    }

    // Delete department
    @DeleteMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        adminService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}
