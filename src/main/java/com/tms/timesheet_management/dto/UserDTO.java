package com.tms.timesheet_management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UserDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    // Optional phone number; if provided, must be exactly 10 digits
    @Pattern(regexp = "^$|\\d{10}", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;

    // Default to true unless explicitly provided
    private boolean active = true;

    // Optional role and department for user-level operations
    private Long roleId;
    private Long departmentId;
}
