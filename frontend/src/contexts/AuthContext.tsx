// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { loginUser, logoutUser } from "../services/authService";

// Types
export type UserRole = "employee" | "manager" | "admin";

export interface User {
  id?: number;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: number;
  roleName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure departmentId and roleName are present if available
      return {
        ...parsed,
        departmentId: parsed.departmentId,
        roleName: parsed.roleName || parsed.role,
      };
    }
    return null;
  });

  const login = async (email: string, password: string) => {
    const loggedInUser = await loginUser(email, password);
    // Ensure departmentId and roleName are present if available
    setUser({
      ...loggedInUser,
      departmentId: loggedInUser.departmentId,
      roleName: loggedInUser.roleName || loggedInUser.role,
    });
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
