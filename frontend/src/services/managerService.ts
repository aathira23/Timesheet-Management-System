import api from "./api";

export interface ManagerStatsDTO {
  teamCount: number;
  projectsCount: number;
  approvalsActioned: number;
  pendingApprovals: number;
}

export const getManagerStats = async (managerId: number | string): Promise<ManagerStatsDTO> => {
  try {
    const response = await api.get(`/api/timesheets/manager/${managerId}/stats`);
    // Backend wraps in ApiResponse { success, message, data }
    return response.data.data as ManagerStatsDTO;
  } catch (err: any) {
    console.error("Failed to fetch manager stats:", err);
    throw err;
  }
};
