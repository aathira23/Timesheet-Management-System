package com.tms.timesheet_management.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {

    private List<TimesheetDTO> timesheets;
    private List<TimesheetDTO> pendingTimesheets;
    private List<ApprovalDTO> approvals;
    private List<ProjectResponseDTO> projects;
    private List<UserResponseDTO> users;

    private Metrics metrics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metrics {
        private Integer totalUsers;
        private Integer totalProjects;
        private Integer pendingApprovals;
        private Double weeklyHours;
        private Double monthlyHours;
    }
}
