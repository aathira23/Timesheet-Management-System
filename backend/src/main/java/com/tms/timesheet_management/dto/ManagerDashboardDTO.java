package com.tms.timesheet_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerDashboardDTO {
    private Integer teamCount;
    private Integer projectsCount;
    private Integer approvalsActioned;
    private Integer pendingApprovals;
}
