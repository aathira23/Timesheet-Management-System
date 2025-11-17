package com.tms.timesheet_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tms.timesheet_management.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email); // For login

    // Find all users by department id
    List<User> findAllByDepartment_Id(Long departmentId);
}
