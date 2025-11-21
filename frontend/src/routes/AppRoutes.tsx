// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";

import Login from "../pages/Login";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import Timesheet from "../pages/Timesheet";
import Projects from "../pages/Projects";
import Reports from "../pages/Reports";
import CalendarView from "../pages/CalendarView";
import Approvals from "../pages/Approvals";
import RequireRole from "./RequireRole";

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "employee":
    default:
      return <EmployeeDashboard />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardRouter />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/timesheet"
        element={
          <ProtectedRoute>
            <Layout>
              <Timesheet />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Layout>
              <Projects />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <RequireRole roles={["admin", "manager"]}>
              <Layout>
                <Reports />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <RequireRole roles={["manager", "admin"]}>
              <Layout>
                <Approvals />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <CalendarView />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
