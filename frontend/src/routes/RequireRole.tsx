import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import type { ReactElement } from "react";

interface RequireRoleProps {
  children: ReactElement;
  roles: string[];
}

const RequireRole = ({ children, roles }: RequireRoleProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    // If user doesn't have required role, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequireRole;
