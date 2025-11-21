package com.tms.timesheet_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tms.timesheet_management.model.Approval;
import com.tms.timesheet_management.model.Timesheet;
import com.tms.timesheet_management.model.User;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    Optional<Approval> findByTimesheet(Timesheet timesheet);
    Optional<Approval> findByTimesheet_Id(Long timesheetId);
    List<Approval> findByManager(User manager);
    List<Approval> findByTimesheet_ProjectId(Long projectId);
    List<Approval> findByTimesheet_User(User employee);
    List<Approval> findByStatus(String status);
    int countByManagerIdAndStatus(Long managerId, String status);

}
