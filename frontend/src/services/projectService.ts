// Get assigned users for a project
export const getAssignedUsersForProject = async (projectId: number): Promise<any[]> => {
  try {
    const res = await api.get(`/api/projects/${projectId}/assigned-users`);
    return res.data.data || [];
  } catch (error) {
    console.error(`Error fetching assigned users for project ${projectId}:`, error);
    return [];
  }
}
// src/services/projectService.ts
import api from "./api";

export interface ProjectDTO {
  id?: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ProjectResponseDTO {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Get all projects
export const getProjects = async (): Promise<ProjectResponseDTO[]> => {
  try {
    const res = await api.get<ApiResponse<ProjectResponseDTO[]>>("/api/projects");
    return res.data.data || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// Get project by ID
export const getProjectById = async (id: number): Promise<ProjectResponseDTO> => {
  try {
    const res = await api.get<ApiResponse<ProjectResponseDTO>>(`/api/projects/${id}`);
    return res.data.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
};

// Create project (Manager only)
export const createProject = async (project: ProjectDTO): Promise<ProjectResponseDTO> => {
  try {
    const res = await api.post<ApiResponse<ProjectResponseDTO>>("/api/projects", project);
    return res.data.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Update project (Manager only)
export const updateProject = async (id: number, project: ProjectDTO): Promise<ProjectResponseDTO> => {
  try {
    const res = await api.put<ApiResponse<ProjectResponseDTO>>(`/api/projects/${id}`, project);
    return res.data.data;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    throw error;
  }
};

// Delete project (Manager only)
export const deleteProject = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/projects/${id}`);
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
};

// Assign users to a project (Manager only)
export const assignUsersToProject = async (projectId: number, userIds: number[]): Promise<void> => {
  try {
    await api.post(`/api/projects/${projectId}/assign`, userIds);
  } catch (error) {
    console.error(`Error assigning users to project ${projectId}:`, error);
    throw error;
  }
};

// Get projects for a manager (if backend supports it), otherwise return all projects
export const getProjectsForManager = async (managerId: number): Promise<ProjectResponseDTO[]> => {
  try {
    const res = await api.get<ApiResponse<ProjectResponseDTO[]>>(`/api/projects/manager/${managerId}`);
    return res.data.data || [];
  } catch (error) {
    // Fallback
    console.warn("Manager-specific projects endpoint not available, fetching all projects instead.");
    return getProjects();
  }
};

