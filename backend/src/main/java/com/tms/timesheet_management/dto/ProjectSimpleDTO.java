package com.tms.timesheet_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSimpleDTO {
    private Long id;
    private String name;
    private String description;
}
