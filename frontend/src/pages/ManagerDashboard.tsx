import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Users, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { getManagerStats } from "../services/managerService";
import { updateApprovalStatus, getApprovalsForManager } from "../services/approvalService";
import { getAllUsers } from "../services/adminService";
import "./ManagerDashboard.css";

interface ManagerStatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface PendingApproval {
  id: string;
  employeeName: string;
  projectName: string;
  hoursLogged: string;
  submittedDate: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  hoursThisWeek: string;
  status: "on-track" | "at-risk" | "completed" | "pending" | "no submission";
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [teamList, setTeamList] = useState<any[]>([]);
  const [managerStats, setManagerStats] = useState<{
    teamCount?: number;
    projectsCount?: number;
    approvalsActioned?: number;
    pendingApprovals?: number;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showAllTeam, setShowAllTeam] = useState(false);

  // Fetch approvals + stats for manager. Kept separate from fetchTeamMembers so responsibilities are clear.
  const fetchManagerData = useCallback(async (managerId: number) => {
    setLoading(true);
    try {
      const [approvalsRes, statsRes] = await Promise.all([
        getApprovalsForManager(managerId).catch((e: any) => {
          console.error("getApprovalsForManager error:", e);
          return [] as any[];
        }),
        getManagerStats(managerId).catch((e: any) => {
          console.error("getManagerStats error:", e);
          return { teamCount: 0, projectsCount: 0, approvalsActioned: 0, pendingApprovals: 0 };
        }),
      ]);

      const pending = (approvalsRes || []).filter(a => a.status === "PENDING");
      setPendingList(pending);
      setManagerStats(statsRes || {});
    } catch (err) {
      console.error("fetchManagerData failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch full team members from admin users and derive manager's team by department
  const fetchTeamMembers = useCallback(async (managerId: number) => {
    try {
      // Do not toggle the global `loading` here to avoid UI flicker when manager data is loading.
      const allUsers = await getAllUsers();
      if (!Array.isArray(allUsers)) {
        setTeamList([]);
        return;
      }

      const managerUser = allUsers.find((u: any) => u.id === managerId);
      const deptId = managerUser?.departmentId;
      if (!deptId) {
        setTeamList([]);
        return;
      }

      const team = allUsers.filter((u: any) => u.departmentId === deptId && (u.roleName === "ROLE_EMPLOYEE" || u.role === "employee" || u.roleName === "EMPLOYEE"));
      setTeamList(team);
    } catch (err) {
      console.error("fetchTeamMembers failed:", err);
      setTeamList([]);
    }
  }, []);

  // Single entry point: when user becomes available, load manager data + team once.
  useEffect(() => {
    if (!user || !user.id) return;
    const id = Number(user.id);
    fetchManagerData(id);
    fetchTeamMembers(id);
  }, [user, fetchManagerData, fetchTeamMembers]);

  // Approve/reject handlers will refresh only manager data (approvals + stats).
  const handleApprove = async (approvalId: string) => {
    if (!window.confirm("Approve this timesheet?")) return;
    try {
      await updateApprovalStatus(Number(approvalId), "APPROVED", "");
      if (user?.id) fetchManagerData(Number(user.id));
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to approve. See console for details.");
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!window.confirm("Reject this timesheet?")) return;
    try {
      await updateApprovalStatus(Number(approvalId), "REJECTED", "");
      if (user?.id) fetchManagerData(Number(user.id));
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject. See console for details.");
    }
  };

  // Derived data (stable and memoized)
  const pendingApprovals: PendingApproval[] = useMemo(() => {
    return pendingList.map((a: any) => ({
      id: String(a.id ?? a.approvalId ?? ""),
      employeeName: a.employeeName || a.userName || a.user?.name || `Employee ${a.userId ?? ""}`,
      projectName: a.projectName || a.project?.name || (a.projectId ? `Project ${a.projectId}` : "Unknown Project"),
      hoursLogged: `${(a.hoursLogged ?? a.hoursWorked ?? 0).toFixed ? (a.hoursLogged ?? a.hoursWorked ?? 0).toFixed(1) : (a.hoursLogged ?? a.hoursWorked ?? 0)}h`,
      submittedDate: a.submittedDate ? new Date(a.submittedDate).toLocaleDateString() : (a.workDate ? new Date(a.workDate).toLocaleDateString() : "N/A"),
    }));
  }, [pendingList]);

  const teamMembers: TeamMember[] = useMemo(() => {
    return teamList.map((member: any) => {
      const memberPending = pendingList.filter((ts: any) => (ts.employeeName || ts.userName) === member.name);
      const pendingHours = memberPending.reduce((sum: number, ts: any) => sum + (ts.hoursLogged ?? ts.hoursWorked ?? 0), 0);
      const status = memberPending.length > 0 ? 'pending' : 'completed';
      return {
        id: String(member.id ?? ""),
        name: member.name || member.email || "Unknown",
        role: member.roleName || member.role || "Employee",
        hoursThisWeek: pendingHours.toFixed(1) + "h (pending)",
        status,
      };
    });
  }, [teamList, pendingList]);

  const statCards: ManagerStatCard[] = useMemo(() => [
    {
      label: "Team Members",
      value: loading ? "..." : String(teamList.length),
      icon: <Users size={24} />,
      color: "#0ea5e9",
      bgColor: "#cffafe",
    },
    {
      label: "Pending Approvals",
      value: loading ? "..." : String(pendingList.length),
      icon: <AlertCircle size={24} />,
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
    {
      label: "Total Projects",
      value: loading ? "..." : String(managerStats.projectsCount ?? 0),
      icon: <Clock size={24} />,
      color: "#10b981",
      bgColor: "#d1fae5",
    },
    {
      label: "Approvals Actioned",
      value: loading ? "..." : String(managerStats.approvalsActioned ?? 0),
      icon: <CheckCircle size={24} />,
      color: "#10b981",
      bgColor: "#d1fae5",
    },
  ], [loading, teamList.length, pendingList.length, managerStats]);

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">Welcome back!</h1>
          <p className="welcome-subtitle">Here's your team's timesheet overview</p>
        </div>
        <div className="demo-role">
          <span className="role-badge manager">{user?.role ?? "Manager"}</span>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: card.bgColor }}>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pending Approvals</h3>
          </div>
          <div className="pending-list">
            {loading ? (
              <p>Loading pending timesheets...</p>
            ) : pendingApprovals.length === 0 ? (
              <p>No pending approvals</p>
            ) : (
              pendingApprovals.slice(0, 5).map((approval) => (
                <div key={approval.id} className="approval-item">
                  <div className="approval-info">
                    <p className="approval-employee">{approval.employeeName}</p>
                    <p className="approval-project">{approval.projectName}</p>
                  </div>
                  <div className="approval-hours">{approval.hoursLogged}</div>
                  <p className="approval-date">{approval.submittedDate}</p>
                  <div className="approval-actions">
                    <button className="btn-approve" onClick={() => handleApprove(approval.id)}>Approve</button>
                    <button className="btn-reject" onClick={() => handleReject(approval.id)}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Team Members</h3>
          </div>
        <div className="team-members-grid">
          {loading ? (
            <p>Loading team members...</p>
          ) : teamMembers.length === 0 ? (
            <p>No team members</p>
          ) : (
            teamMembers.slice(0, 4).map((member) => (
              <div key={member.id} className="team-member-card">
                <div className="member-avatar">{member.name.charAt(0)}</div>
                <div className="member-info">
                  <p className="member-name">{member.name}</p>
                  <p className="member-role">{member.role}</p>
                </div>
                <div className="member-hours">{member.hoursThisWeek}</div>
                <div className={`member-status ${member.status}`}>{member.status}</div>
              </div>
            ))
          )}
        </div>

        {showAllTeam && (
          <div className="modal-overlay" onClick={() => setShowAllTeam(false)}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>All Team Members ({teamMembers.length})</h3>
                <button className="modal-close" onClick={() => setShowAllTeam(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="team-members-list">
                  {teamMembers.map(member => (
                    <div key={member.id} className="team-member-card">
                      <div className="member-avatar">{member.name.charAt(0)}</div>
                      <div className="member-info">
                        <p className="member-name">{member.name}</p>
                        <p className="member-role">{member.role}</p>
                      </div>
                      <div className="member-hours">{member.hoursThisWeek}</div>
                      <div className={`member-status ${member.status}`}>{member.status}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="close-modal-btn" onClick={() => setShowAllTeam(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
