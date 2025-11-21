// Utility to decode JWT and extract claims
export interface JWTPayload {
  sub: string; // email
  role: string;
  userId?: number;
  id?: number;
  iat: number;
  exp: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
};

export const extractRoleFromToken = (token: string): string => {
  const payload = decodeJWT(token);
  if (!payload || !payload.role) return "employee";
  // Backend returns roles like "ROLE_ADMIN", "ROLE_MANAGER", etc.
  const role = payload.role.toLowerCase();
  if (role.includes("admin")) return "admin";
  if (role.includes("manager")) return "manager";
  return "employee";
};

export const extractEmailFromToken = (token: string): string => {
  const payload = decodeJWT(token);
  return payload?.sub || "";
};

export const extractUserIdFromToken = (token: string): number | undefined => {
  const payload = decodeJWT(token);
  return payload?.userId || payload?.id || undefined;
};
