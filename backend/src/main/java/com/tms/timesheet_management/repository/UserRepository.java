package com.tms.timesheet_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tms.timesheet_management.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // For login
    Optional<User> findByEmail(String email);

    // Find all users by department id
    List<User> findAllByDepartment_Id(Long departmentId);

    // Count users under a specific manager
    int countByManager_Id(Long managerId);

    // Optional: Find all users under a specific manager
    List<User> findAllByManager_Id(Long managerId);
}
