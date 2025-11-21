package com.tms.timesheet_management.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.tms.timesheet_management.exception.BadRequestException;
import com.tms.timesheet_management.exception.ForbiddenException;
import com.tms.timesheet_management.exception.NotFoundException;
import com.tms.timesheet_management.model.Approval;
import com.tms.timesheet_management.model.Project;
import com.tms.timesheet_management.model.Timesheet;
import com.tms.timesheet_management.model.User;
import com.tms.timesheet_management.repository.ApprovalRepository;
import com.tms.timesheet_management.repository.ProjectAssignmentRepository;
import com.tms.timesheet_management.repository.ProjectRepository;
import com.tms.timesheet_management.repository.TimesheetRepository;
import com.tms.timesheet_management.repository.UserRepository;

@Service
public class TimesheetService {

    @Autowired private TimesheetRepository timesheetRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ApprovalRepository approvalRepository;
    @Autowired private ProjectAssignmentRepository projectAssignmentRepository;
    @Autowired private com.tms.timesheet_management.repository.DepartmentRepository departmentRepository;

    // GET METHODS
    public List<Timesheet> getAllTimesheets() { return timesheetRepository.findAll(); }
    public Optional<Timesheet> getTimesheetById(Long id) { return timesheetRepository.findById(id); }
    public List<Timesheet> getTimesheetsByDate(LocalDate date) { return timesheetRepository.findByWorkDate(date); }

    // CREATE
    public Timesheet createTimesheet(Timesheet timesheet) {
        User user = validateUser(timesheet.getUser());

        Project project = null;
        if (timesheet.getProject() != null && timesheet.getProject().getId() != null) {
            project = validateProject(timesheet.getProject());
        }

        // Validate that user has a manager (required for approval)
        if (user.getDepartment() == null || user.getDepartment().getManager() == null) {
            throw new BadRequestException("Employee's department must have an assigned manager for timesheet approval");
        }

        // Employee cannot set status; always PENDING
        timesheet.setApprovalStatus("PENDING");
        timesheet.setUser(user);
        timesheet.setProject(project); // may be null for activity-only

        Timesheet saved = timesheetRepository.save(timesheet);
        syncApprovalWithTimesheet(saved); // create initial approval
        return saved;
    }

    // UPDATE
    public Timesheet updateTimesheet(Long id, Timesheet details) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Timesheet not found"));

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new ForbiddenException("Unauthenticated");

        boolean isEmployee = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));

        if (!isEmployee) throw new ForbiddenException("Only employees can update timesheets");

        String principalEmail = auth.getName();
        if (!principalEmail.equals(timesheet.getUser().getEmail()))
            throw new ForbiddenException("Employees can only update their own timesheets");

        if (!"PENDING".equalsIgnoreCase(timesheet.getApprovalStatus()))
            throw new BadRequestException("Only pending timesheets can be updated");

        if (details.getWorkDate() != null) timesheet.setWorkDate(details.getWorkDate());
        if (details.getHoursWorked() != null) timesheet.setHoursWorked(details.getHoursWorked());
        if (details.getDescription() != null) timesheet.setDescription(details.getDescription());
        if (details.getActivityType() != null) timesheet.setActivityType(details.getActivityType());

        // Employees cannot change approval status
        timesheet.setApprovalStatus("PENDING");

        Timesheet updated = timesheetRepository.save(timesheet);
        syncApprovalWithTimesheet(updated);
        return updated;
    }

    // DELETE
    public void deleteTimesheet(Long id) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Timesheet not found"));

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new ForbiddenException("Unauthenticated");

        boolean isEmployee = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));

        if (!isEmployee) throw new ForbiddenException("Only employees can delete timesheets");

        String principalEmail = auth.getName();
        if (!principalEmail.equals(timesheet.getUser().getEmail()))
            throw new ForbiddenException("Employees can only delete their own timesheets");

        if (!"PENDING".equalsIgnoreCase(timesheet.getApprovalStatus()))
            throw new BadRequestException("Only pending timesheets can be deleted");

        approvalRepository.findByTimesheet_Id(timesheet.getId())
        .ifPresent(approval -> approvalRepository.delete(approval));


        timesheetRepository.delete(timesheet);
    }

    // PENDING TIMESHEETS
    public List<Timesheet> getPendingTimesheetsForEmployee(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Employee with ID " + userId + " not found"));
        return timesheetRepository.findByUserAndApprovalStatus(user, "PENDING");
    }

    public List<Timesheet> getPendingTimesheetsForManager(Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("User with ID " + managerId + " not found"));

        boolean isManager = manager.getDepartment() != null &&
                manager.getDepartment().getManager() != null &&
                manager.getDepartment().getManager().getId().equals(managerId);

        if (!isManager) throw new ForbiddenException("User with ID " + managerId + " is not a manager");

        return timesheetRepository.findPendingTimesheetsByManager(managerId);
    }

    // HELPERS
    private User validateUser(User user) {
        if (user == null || user.getId() == null) throw new BadRequestException("User is required");
        User found = userRepository.findById(user.getId()).orElseThrow(() -> new NotFoundException("User not found"));

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            boolean isEmployee = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));
            if (isEmployee) {
                String principalEmail = auth.getName();
                if (!principalEmail.equals(found.getEmail())) {
                    throw new ForbiddenException("Employees can only create timesheets for themselves");
                }
            }
        }
        return found;
    }

    private Project validateProject(Project project) {
        if (project == null || project.getId() == null) throw new BadRequestException("Project is required");
        Project found = projectRepository.findById(project.getId()).orElseThrow(() -> new NotFoundException("Project not found"));

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            boolean isEmployee = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));
            if (isEmployee) {
                String principalEmail = auth.getName();
                var principalUser = userRepository.findByEmail(principalEmail).orElse(null);
                if (principalUser == null) throw new ForbiddenException("Authenticated user not found");
                boolean assigned = projectAssignmentRepository.existsByUserIdAndProjectId(principalUser.getId(), found.getId());
                if (!assigned) throw new BadRequestException("Employee is not assigned to the project");
            }
        }
        return found;
    }

    private void syncApprovalWithTimesheet(Timesheet timesheet) {
        if (timesheet.getApprovalStatus() == null) return;
        String status = timesheet.getApprovalStatus().toUpperCase();
        if (!status.equals("APPROVED") && !status.equals("REJECTED") && !status.equals("PENDING"))
            return;

        Optional<Approval> existingOpt = approvalRepository.findByTimesheet_Id(timesheet.getId());

        Approval approval;
        if (existingOpt.isPresent()) {
            approval = existingOpt.get();
            approval.setStatus(status);
            approval.setActionDate(timesheet.getApprovalStatus().equalsIgnoreCase("PENDING") ? null : LocalDateTime.now());
        } else {
            approval = new Approval();
            approval.setTimesheet(timesheet);
            approval.setStatus(status);
            approval.setActionDate(timesheet.getApprovalStatus().equalsIgnoreCase("PENDING") ? null : LocalDateTime.now());
            if (timesheet.getUser() != null &&
                    timesheet.getUser().getDepartment() != null &&
                    timesheet.getUser().getDepartment().getManager() != null) {
                approval.setManager(timesheet.getUser().getDepartment().getManager());
            }
        }
        approvalRepository.save(approval);
    }

    // NEW METHODS FOR DASHBOARD
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found with email: " + email));
    }

    public List<Timesheet> getTimesheetsByUser(User user) {
        return timesheetRepository.findByUser(user);
    }

    public com.tms.timesheet_management.dto.TimesheetStatsDTO getTimesheetStats(User user) {
        List<Timesheet> allTimesheets = timesheetRepository.findByUser(user);
        
        LocalDate now = LocalDate.now();
        LocalDate weekStart = now.minusDays(now.getDayOfWeek().getValue() - 1);
        LocalDate monthStart = now.withDayOfMonth(1);

        // Calculate weekly hours
        Double weeklyHours = allTimesheets.stream()
            .filter(t -> !t.getWorkDate().isBefore(weekStart) && !t.getWorkDate().isAfter(now))
            .mapToDouble(t -> t.getHoursWorked() != null ? (double) t.getHoursWorked() : 0.0)
            .sum();

        // Calculate monthly hours
        Double monthlyHours = allTimesheets.stream()
            .filter(t -> !t.getWorkDate().isBefore(monthStart) && !t.getWorkDate().isAfter(now))
            .mapToDouble(t -> t.getHoursWorked() != null ? (double) t.getHoursWorked() : 0.0)
            .sum();

        // Count by status
        Integer pendingCount = (int) allTimesheets.stream()
            .filter(t -> "PENDING".equalsIgnoreCase(t.getApprovalStatus()))
            .count();

        Integer approvedCount = (int) allTimesheets.stream()
            .filter(t -> "APPROVED".equalsIgnoreCase(t.getApprovalStatus()))
            .count();

        Integer rejectedCount = (int) allTimesheets.stream()
            .filter(t -> "REJECTED".equalsIgnoreCase(t.getApprovalStatus()))
            .count();

        return com.tms.timesheet_management.dto.TimesheetStatsDTO.builder()
            .weeklyHours(weeklyHours)
            .monthlyHours(monthlyHours)
            .pendingCount(pendingCount)
            .approvedCount(approvedCount)
            .rejectedCount(rejectedCount)
            .build();
    }

    public java.util.List<com.tms.timesheet_management.dto.ProjectSimpleDTO> getAssignedProjects(User user) {
        List<Project> projects = projectRepository.findAll().stream()
            .filter(p -> projectAssignmentRepository.existsByUserIdAndProjectId(user.getId(), p.getId()))
            .collect(Collectors.toList());

        return projects.stream()
            .map(p -> com.tms.timesheet_management.dto.ProjectSimpleDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .build())
            .collect(Collectors.toList());
    }

    // Manager dashboard statistics
    public com.tms.timesheet_management.dto.ManagerDashboardDTO getManagerDashboardStats(Long managerId) {

        // Get manager
        com.tms.timesheet_management.model.User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("User with ID " + managerId + " not found"));

        // Departments managed by this manager
        List<com.tms.timesheet_management.model.Department> departments = departmentRepository.findByManager_Id(managerId);

        // Count team members (employees in departments managed by this manager)
        int teamCount = 0;
        for (com.tms.timesheet_management.model.Department dept : departments) {
            List<com.tms.timesheet_management.model.User> users = userRepository.findAllByDepartment_Id(dept.getId());
            for (com.tms.timesheet_management.model.User u : users) {
                if (u.getRole() != null && ("EMPLOYEE".equalsIgnoreCase(u.getRole().getName()) || "ROLE_EMPLOYEE".equalsIgnoreCase(u.getRole().getName()))) {
                    teamCount++;
                }
            }
        }

        // Total projects count: only projects created by this manager in their department
        com.tms.timesheet_management.model.Department managerDept = manager.getDepartment();
        long projectsCount = projectRepository.findAll().stream()
            .filter(p -> p.getDepartment() != null && p.getDepartment().getId().equals(managerDept.getId()))
            .count();

        // Approvals acted on by this manager (status != PENDING)
        List<com.tms.timesheet_management.model.Approval> approvals = approvalRepository.findByManager(manager);
        long approvalsActioned = (approvals != null) ? approvals.stream().filter(a -> a.getStatus() != null && !"PENDING".equalsIgnoreCase(a.getStatus())).count() : 0;

        // Pending approvals for manager
        List<com.tms.timesheet_management.model.Timesheet> pending = timesheetRepository.findPendingTimesheetsByManager(managerId);
        long pendingApprovals = (pending != null) ? pending.size() : 0;

        return com.tms.timesheet_management.dto.ManagerDashboardDTO.builder()
                .teamCount(teamCount)
                .projectsCount((int) projectsCount)
                .approvalsActioned((int) approvalsActioned)
                .pendingApprovals((int) pendingApprovals)
                .build();
    }
}

            