package com.tms.timesheet_management.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}