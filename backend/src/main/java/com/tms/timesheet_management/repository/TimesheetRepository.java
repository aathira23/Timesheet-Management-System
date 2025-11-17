package com.tms.timesheet_management.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tms.timesheet_management.model.Timesheet;
import com.tms.timesheet_management.model.User;

public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {

    List<Timesheet> findByUser(User user);
    List<Timesheet> findByUserAndWorkDate(User user, LocalDate workDate);

    // Pending timesheets for manager
    @Query("SELECT t FROM Timesheet t " +
           "WHERE t.approvalStatus = 'PENDING' " +
           "AND t.user.department.manager.id = :managerId")
    List<Timesheet> findPendingTimesheetsByManager(@Param("managerId") Long managerId);

    List<Timesheet> findByUserAndApprovalStatus(User user, String status);

    // Get all timesheets for a specific date
    List<Timesheet> findByWorkDate(LocalDate workDate);
}
