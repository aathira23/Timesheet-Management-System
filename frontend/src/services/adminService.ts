import api from "./api";

export interface RoleDTO {
  id: number;
  name: string;
}

export interface UserDTO {
  id?: number;
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  active?: boolean;
  roleId?: number;
  roleName?: string;
  departmentId?: number;
  departmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentDTO {
  id?: number;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
}

export interface AdminMetricsDTO {
  totalUsers: number;
  activeSessions: number;
  systemAlerts: number;
  reportsGenerated: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Roles
export const getAllRoles = async (): Promise<RoleDTO[]> => {
  try {
    const response = await api.get<RoleDTO[]>("/roles");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error("Failed to fetch roles:", error);
    throw error;
  }
};

// Users
export const getAllUsers = async (): Promise<UserDTO[]> => {
  try {
    const response = await api.get<UserDTO[]>("/admin/users");
    // Backend returns array directly, not wrapped in ApiResponse
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

export const getUserById = async (id: number): Promise<UserDTO> => {
  try {
    const response = await api.get<ApiResponse<UserDTO>>(`/admin/users/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error;
  }
};

export const createUser = async (user: Partial<UserDTO>): Promise<UserDTO> => {
  try {
    const response = await api.post<UserDTO>("/admin/users", user);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create user:", error);
    throw error;
  }
};

export const updateUser = async (id: number, user: Partial<UserDTO>): Promise<UserDTO> => {
  try {
    const response = await api.put<UserDTO>(`/admin/users/${id}`, user);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/admin/users/${id}`);
  } catch (error: any) {
    console.error(`Failed to delete user ${id}:`, error);
    throw error;
  }
};

// Departments
export const getAllDepartments = async (): Promise<DepartmentDTO[]> => {
  try {
    const response = await api.get<DepartmentDTO[]>("/admin/departments");
    // Backend returns array directly, not wrapped in ApiResponse
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error("Failed to fetch departments:", error);
    throw error;
  }
};

export const getDepartmentById = async (id: number): Promise<DepartmentDTO> => {
  try {
    const response = await api.get<DepartmentDTO>(`/admin/departments/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch department ${id}:`, error);
    throw error;
  }
};

export const createDepartment = async (dept: Partial<DepartmentDTO>): Promise<DepartmentDTO> => {
  try {
    const response = await api.post<DepartmentDTO>("/admin/departments", dept);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create department:", error);
    throw error;
  }
};

export const updateDepartment = async (id: number, dept: Partial<DepartmentDTO>): Promise<DepartmentDTO> => {
  try {
    const response = await api.put<DepartmentDTO>(`/admin/departments/${id}`, dept);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update department ${id}:`, error);
    throw error;
  }
};

export const deleteDepartment = async (id: number): Promise<void> => {
  try {
    await api.delete(`/admin/departments/${id}`);
  } catch (error: any) {
    console.error(`Failed to delete department ${id}:`, error);
    throw error;
  }
};
