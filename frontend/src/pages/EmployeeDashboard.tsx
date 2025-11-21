import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { getTimesheets, getAssignedProjects, getTimesheetStats } from "../services/timesheetService";
import "./Dashboard.css";
import "../styles/dashboard-custom.css";

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface TimeSheet {
  id: string;
  dateRange: string;
  project: string;
  hours: string;
  status: "pending" | "approved" | "rejected";
}

interface Project {
  id: string;
  name: string;
  role: string;
  hoursLogged: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timesheetsList, setTimesheetsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [timesheetData, projectData, statsData] = await Promise.all([
          getTimesheets(),
          getAssignedProjects(user),
          getTimesheetStats(user),
        ]);
        setTimesheetsList(timesheetData || []);
        setProjectsList(projectData || []);
        setStats(statsData);
      } catch (err) {
        console.error("💥 Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  // Stat cards
  const statCards: StatCard[] = [
    {
      label: "Projects Assigned",
      value: loading ? "..." : `${projectsList.length}`,
      icon: <Calendar size={24} />, color: "#0e2239", bgColor: "#b6e0fe", // darker text, more contrast
    },
    {
      label: "All Timesheets",
      value: loading ? "..." : `${timesheetsList.length}`,
      icon: <Clock size={24} />, color: "#134e4a", bgColor: "#a7f3d0",
    },
    {
      label: "Pending Timesheets",
      value: loading ? "..." : `${stats?.pendingCount || 0}`,
      icon: <AlertCircle size={24} />, color: "#78350f", bgColor: "#fde68a",
    },
    {
      label: "Total Hours This Week",
      value: loading ? "..." : `${(stats?.weeklyHours || 0).toFixed(1)}h`,
      icon: <CheckCircle size={24} />, color: "#312e81", bgColor: "#c7d2fe",
    },
  ];

  // Calculate total hours logged per project from timesheetsList
  const myProjects: Project[] = projectsList.map((p: any) => {
    const totalHours = timesheetsList
      .filter((ts: any) => ts.projectId === p.id)
      .reduce((sum: number, ts: any) => sum + (ts.hoursWorked || 0), 0);
    return {
      id: p.id?.toString() || "",
      name: p.name || "Unknown",
      role: p.description || "N/A",
      hoursLogged: `${totalHours.toFixed(1)}h logged`,
    };
  });

  // Only show timesheets from the past 3 days
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 2); // includes today, yesterday, day before
  const recentTimesheets: TimeSheet[] = timesheetsList
    .filter((ts: any) => {
      if (!ts.workDate) return false;
      const tsDate = new Date(ts.workDate);
      return tsDate >= threeDaysAgo && tsDate <= now;
    })
    .sort((a: any, b: any) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime())
    .map((ts: any) => ({
      id: ts.id?.toString() || "",
      dateRange: ts.workDate ? new Date(ts.workDate).toLocaleDateString() : "N/A",
      project: ts.projectName || "Unknown Project",
      hours: `${(ts.hoursWorked || 0).toFixed(1)}h`,
      status: (ts.approvalStatus?.toLowerCase() as "pending" | "approved" | "rejected") || "pending",
    }));

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">Welcome back!</h1>
          <p className="welcome-subtitle">Here's your timesheet overview</p>
        </div>
        <div className="demo-role">
          <span className="role-badge">{user?.role ?? "Employee"}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
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

      {/* My Projects Overview */}
      <div className="card my-projects" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Assigned Projects Overview</h3>
        <div className="projects-list">
          {loading ? (
            <p>Loading projects...</p>
          ) : myProjects.length === 0 ? (
            <p>No projects assigned</p>
          ) : (
            myProjects.map((project) => (
              <div key={project.id} className="project-item">
                <div className="project-info">
                  <p className="project-name">{project.name}</p>
                  <p className="project-role">{project.role}</p>
                </div>
                <p className="project-hours">{project.hoursLogged}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert/Reminder Section */}
      <div className="alert-card" style={{ marginBottom: 24, background: '#fde68a', border: '1px solid #fbbf24', borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, color: '#78350f' }}>Don’t miss out!</h3>
          <p style={{ margin: 0, color: '#78350f' }}>Submit your timesheet for the work you’ve done. Stay on top of your records!</p>
        </div>
        <button
          style={{ background: '#78350f', color: '#fffbe6', padding: '10px 20px', borderRadius: 6, border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #fde68a' }}
          onClick={() => navigate('/calendar')}
        >
          Submit Timesheet
        </button>
      </div>

      {/* Recent Timesheets (full width) */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header">
          <h3 className="card-title">Recent Timesheets (Last 3 Days)</h3>
        </div>
        <div className="timesheets-list">
          {loading ? (
            <p>Loading timesheets...</p>
          ) : recentTimesheets.length === 0 ? (
            <p>No timesheets found</p>
          ) : (
            recentTimesheets.map((sheet) => (
              <div key={sheet.id} className="timesheet-item">
                <div className="timesheet-info">
                  <p className="timesheet-date">{sheet.dateRange}</p>
                  <p className="timesheet-project">{sheet.project}</p>
                </div>
                <div className="timesheet-hours">{sheet.hours}</div>
                <div className={`status-badge status-${sheet.status}`}>
                  {sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;