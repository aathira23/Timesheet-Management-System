// src/services/approvalService.ts
import api from "./api";

export interface ApprovalDTO {
  id: number;
  timesheetId: number;
  employeeName?: string;
  projectName?: string;
  hoursLogged?: number;
  submittedDate?: string;
  status: string;
  remarks?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Get all approvals (Manager only)
export const getAllApprovals = async (): Promise<ApprovalDTO[]> => {
  try {
    const res = await api.get<ApiResponse<ApprovalDTO[]>>("/api/approvals");
    return res.data.data || [];
  } catch (error) {
    console.error("Error fetching approvals:", error);
    throw error;
  }
};

// Get approval by ID
export const getApprovalById = async (id: number): Promise<ApprovalDTO> => {
  try {
    const res = await api.get<ApiResponse<ApprovalDTO>>(`/api/approvals/${id}`);
    return res.data.data;
  } catch (error) {
    console.error(`Error fetching approval ${id}:`, error);
    throw error;
  }
};

// Update approval status (Manager only)
export const updateApprovalStatus = async (
  id: number,
  status: string,
  remarks?: string
): Promise<ApprovalDTO> => {
  try {
    const res = await api.put<ApiResponse<ApprovalDTO>>(
      `/api/approvals/${id}/status`,
      {},
      { params: { status, remarks } }
    );
    return res.data.data;
  } catch (error) {
    console.error(`Error updating approval ${id}:`, error);
    throw error;
  }
};

// Get approvals for a specific manager
export const getApprovalsForManager = async (managerId: number): Promise<ApprovalDTO[]> => {
  try {
    const res = await api.get<ApiResponse<ApprovalDTO[]>>(`/api/approvals/manager/${managerId}`);
    return res.data.data || [];
  } catch (error) {
    console.error(`Error fetching approvals for manager ${managerId}:`, error);
    throw error;
  }
};
