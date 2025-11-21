package com.tms.timesheet_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetStatsDTO {
    private Double weeklyHours;
    private Double monthlyHours;
    private Integer pendingCount;
    private Integer approvedCount;
    private Integer rejectedCount;
}
