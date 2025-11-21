// src/services/authService.ts
import api from "./api";
import type { User, UserRole } from "../contexts/AuthContext";
import { extractRoleFromToken, extractEmailFromToken, extractUserIdFromToken } from "../utils/jwtUtils";

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const res = await api.post("/auth/login", { email, password });
    console.log("Login response data:", res.data);
    console.log("Login response status:", res.status);
    
    // Handle different response structures
    // The backend might return: { token: "..." } or just the token string
    let token: string;
    
    if (typeof res.data === "string") {
      // Direct token string
      token = res.data;
    } else if (res.data && typeof res.data === "object") {
      // Wrapped in an object
      const data = res.data as any;
      token = data.token || data.data || (typeof data === "string" ? data : "");
    } else {
      token = String(res.data);
    }
    
    console.log("Token type:", typeof token, "Token length:", token?.length);
    
    if (!token || typeof token !== "string" || token.length === 0) {
      console.error("Invalid token format", token);
      throw new Error("Invalid token in response");
    }

    // Extract role, email, and user ID from JWT token
    const role = extractRoleFromToken(token);
    const extractedEmail = extractEmailFromToken(token);
    const userId = extractUserIdFromToken(token);
    console.log("Extracted role:", role, "email:", extractedEmail, "userId:", userId);

    localStorage.setItem("token", token);
    // Use email from JWT; name is first part of email for now
    let user: User = { 
      id: userId,
      email: extractedEmail || email, 
      name: email.split("@")[0], 
      role: role as UserRole 
    };
    // Fetch full user details only if admin
if (role === "admin") {
  try {
    const userDetailsRes = await api.get(`/admin/users/${userId}`);
    const userDetails = userDetailsRes.data?.data || userDetailsRes.data;
    if (userDetails) {
      user = {
        ...user,
        departmentId: userDetails.departmentId,
        roleName: userDetails.roleName || userDetails.role,
      };
    }
  } catch (err) {
    console.warn("Admin user details fetch failed", err);
  }
}

    localStorage.setItem("user", JSON.stringify(user));
    console.log("Login successful, user:", user);
    return user;
  } catch (error: any) {
    console.error("Login error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
