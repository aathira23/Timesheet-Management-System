package com.tms.timesheet_management.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role; // ROLE_EMPLOYEE, ROLE_MANAGER, ROLE_ADMIN
}
