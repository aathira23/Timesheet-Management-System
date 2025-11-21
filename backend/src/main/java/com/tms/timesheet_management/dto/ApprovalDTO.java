package com.tms.timesheet_management.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDTO {
    private Long id;
    private Long timesheetId;
    private Long managerId;
    private String status;
    private String comments;
    private LocalDateTime actionDate;
    // For frontend display
    private String employeeName;
    private String projectName;
    private Double hoursLogged;
    private String submittedDate;
    private String remarks;
}
