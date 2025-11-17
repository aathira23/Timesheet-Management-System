package com.tms.timesheet_management.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Approval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Timesheet is required")
    @OneToOne
    @JoinColumn(name = "timesheet_id", nullable = false)
    private Timesheet timesheet;

    @NotNull(message = "Manager is required")
    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @NotNull(message = "Status is required")
    @Column(nullable = false)
    private String status = "PENDING";

    @Size(max = 500, message = "Comments cannot exceed 500 characters")
    private String comments;

    
    @Column(nullable = true)
    private LocalDateTime actionDate;
}
