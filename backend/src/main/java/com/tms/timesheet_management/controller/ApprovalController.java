package com.tms.timesheet_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tms.timesheet_management.dto.ApiResponse;
import com.tms.timesheet_management.dto.ApprovalDTO;
import com.tms.timesheet_management.model.Approval;
import com.tms.timesheet_management.service.ApprovalService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/approvals")
@CrossOrigin(origins = "*")
@Tag(name = "Approvals", description = "Operations related to approvals")
public class ApprovalController {
    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Get approvals for a specific manager")
    public ResponseEntity<ApiResponse<List<ApprovalDTO>>> getApprovalsForManager(@PathVariable Long managerId) {
        List<ApprovalDTO> approvals = approvalService.getApprovalsForManager(managerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Approvals for manager fetched successfully", approvals));
    }

    @Autowired
    private ApprovalService approvalService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER')")
    @Operation(summary = "Get all approvals")
    public ResponseEntity<ApiResponse<List<Approval>>> getAllApprovals() {
        List<Approval> approvals = approvalService.getAllApprovals();
        if (approvals.isEmpty())
            return ResponseEntity.ok(new ApiResponse<>(true, "No approvals found", approvals));
        return ResponseEntity.ok(new ApiResponse<>(true, "Approvals fetched successfully", approvals));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get approval by ID")
    public ResponseEntity<ApiResponse<Approval>> getApprovalById(@PathVariable Long id) {
        Approval approval = approvalService.getApprovalById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Approval fetched successfully", approval));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Update approval status (Manager only)")
    public ResponseEntity<ApiResponse<Approval>> updateApprovalStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String remarks) {
        Approval updated = approvalService.updateApprovalStatus(id, status, remarks);
        return ResponseEntity.ok(new ApiResponse<>(true, "Approval updated successfully", updated));
    }
}
