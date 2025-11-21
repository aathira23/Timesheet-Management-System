package com.tms.timesheet_management.service;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tms.timesheet_management.dto.ApprovalDTO;
import com.tms.timesheet_management.exception.BadRequestException;
import com.tms.timesheet_management.exception.ForbiddenException;
import com.tms.timesheet_management.exception.NotFoundException;
import com.tms.timesheet_management.model.Approval;
import com.tms.timesheet_management.repository.ApprovalRepository;
import com.tms.timesheet_management.repository.TimesheetRepository;
import com.tms.timesheet_management.repository.UserRepository;

@Service
public class ApprovalService {
    public List<ApprovalDTO> getApprovalsForManager(Long managerId) {
        var manager = userRepository.findById(managerId)
            .orElseThrow(() -> new NotFoundException("Manager not found"));
        List<Approval> approvals = approvalRepository.findByManager(manager);
        return approvals.stream().map(a -> {
            var ts = a.getTimesheet();
            return new ApprovalDTO(
                a.getId(),
                ts.getId(),
                managerId,
                a.getStatus(),
                a.getComments(),
                a.getActionDate(),
                ts.getUser() != null ? ts.getUser().getName() : null,
                ts.getProject() != null ? ts.getProject().getName() : null,
                ts.getHoursWorked(),
                ts.getWorkDate() != null ? ts.getWorkDate().toString() : null,
                a.getComments()
            );
        }).toList();
    }

    @Autowired
    private ApprovalRepository approvalRepository;

    @Autowired
    private TimesheetRepository timesheetRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Approval> getAllApprovals() {
        return approvalRepository.findAll();
    }

    public Approval getApprovalById(Long id) {
        return approvalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Approval with ID " + id + " not found"));
    }

    @Transactional
    public Approval updateApprovalStatus(Long id, String status, String remarks) {
        Approval approval = getApprovalById(id);

        if (!status.equalsIgnoreCase("APPROVED") && !status.equalsIgnoreCase("REJECTED"))
            throw new BadRequestException("Invalid status. Allowed: APPROVED, REJECTED");

        // Validate that the authenticated user is the assigned manager
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            throw new ForbiddenException("Unauthenticated");

        String principalEmail = auth.getName();
        var principalUser = userRepository.findByEmail(principalEmail)
                .orElseThrow(() -> new ForbiddenException("Authenticated user not found"));

        if (!principalUser.getId().equals(approval.getManager().getId()))
            throw new ForbiddenException("Only the assigned manager can approve/reject this timesheet");

        approval.setStatus(status.toUpperCase());
        approval.setActionDate(LocalDateTime.now());
        if (remarks != null) approval.setComments(remarks);

        // Sync with related timesheet
        approval.getTimesheet().setApprovalStatus(status.toUpperCase());
        timesheetRepository.save(approval.getTimesheet());

        return approvalRepository.save(approval);
    }
}
