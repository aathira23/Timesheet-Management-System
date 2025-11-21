// src/services/timesheetService.ts
import api from "./api";

export interface TimesheetDTO {
  id?: number;
  userId?: number;
  userName?: string;
  projectId: number;
  workDate: string;
  hoursWorked: number;
  description?: string;
  approvalStatus?: string;
  projectName?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Get all timesheets (Employee only)
export const getTimesheets = async (): Promise<TimesheetDTO[]> => {
  try {
    console.log("🔄 Calling GET /api/timesheets");
    const res = await api.get<ApiResponse<TimesheetDTO[]>>("/api/timesheets");
    console.log("📥 Response received:", res.status, res.data);
    return res.data.data || [];
  } catch (error: any) {
    console.error("❌ Error fetching timesheets:", error.response?.status, error.response?.data, error.message);
    throw error;
  }
};

// Get timesheet by ID
export const getTimesheetById = async (id: number): Promise<TimesheetDTO> => {
  try {
    const res = await api.get<ApiResponse<TimesheetDTO>>(`/api/timesheets/${id}`);
    return res.data.data;
  } catch (error) {
    console.error(`Error fetching timesheet ${id}:`, error);
    throw error;
  }
};

// Create timesheet (Employee only)
export const createTimesheet = async (timesheet: TimesheetDTO): Promise<TimesheetDTO> => {
  try {
    console.log("🔄 Creating timesheet:", timesheet);
    const res = await api.post<ApiResponse<TimesheetDTO>>("/api/timesheets", {
      projectId: timesheet.projectId || null,
      workDate: timesheet.workDate,
      hoursWorked: timesheet.hoursWorked,
      description: timesheet.description,
      activityType: (timesheet as any).activityType || null,
    });
    console.log("✅ Timesheet created:", res.data);
    return res.data.data;
  } catch (error: any) {
    console.error("❌ Error creating timesheet:", error.response?.status, error.response?.data, error.message);
    throw error;
  }
};

// Update timesheet (Employee only, own timesheet, pending only)
export const updateTimesheet = async (id: number, timesheet: TimesheetDTO): Promise<TimesheetDTO> => {
  try {
    const res = await api.put<ApiResponse<TimesheetDTO>>(`/api/timesheets/${id}`, timesheet);
    return res.data.data;
  } catch (error) {
    console.error(`Error updating timesheet ${id}:`, error);
    throw error;
  }
};

// Delete timesheet (Employee only, own, pending only)
export const deleteTimesheet = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/timesheets/${id}`);
  } catch (error) {
    console.error(`Error deleting timesheet ${id}:`, error);
    throw error;
  }
};

// Get pending timesheets for employee
export const getPendingTimesheetsForEmployee = async (employeeId: number): Promise<TimesheetDTO[]> => {
  try {
    const res = await api.get<ApiResponse<TimesheetDTO[]>>(`/api/timesheets/pending/employee/${employeeId}`);
    return res.data.data || [];
  } catch (error) {
    console.error(`Error fetching pending timesheets for employee ${employeeId}:`, error);
    throw error;
  }
};

// Get pending timesheets for manager approval
export const getPendingTimesheetsForManager = async (managerId: number): Promise<TimesheetDTO[]> => {
  try {
    const res = await api.get<ApiResponse<TimesheetDTO[]>>(`/api/timesheets/pending/manager/${managerId}`);
    return res.data.data || [];
  } catch (error) {
    console.error(`Error fetching pending timesheets for manager ${managerId}:`, error);
    throw error;
  }
};

// Get timesheets by date
export const getTimesheetsByDate = async (date: string): Promise<TimesheetDTO[]> => {
  try {
    const res = await api.get<ApiResponse<TimesheetDTO[]>>("/api/timesheets/date", { params: { date } });
    return res.data.data || [];
  } catch (error) {
    console.error(`Error fetching timesheets for date ${date}:`, error);
    throw error;
  }
};

// Get current employee's timesheet statistics
export const getTimesheetStats = async (_user: any) => {
  try {
    console.log("🔄 Calling GET /api/timesheets/me/stats");
    const res = await api.get<ApiResponse<any>>("/api/timesheets/me/stats");
    console.log("📥 Stats response received:", res.status, res.data);
    return res.data.data || null;
  } catch (error: any) {
    console.error("❌ Error fetching timesheet stats:", error.response?.status, error.response?.data, error.message);
    throw error;
  }
};

// Get assigned projects for current employee
export const getAssignedProjects = async (_user: any) => {
  try {
    console.log("🔄 Calling GET /api/timesheets/me/projects");
    const res = await api.get<ApiResponse<any[]>>("/api/timesheets/me/projects");
    console.log("📥 Projects response received:", res.status, res.data);
    return res.data.data || [];
  } catch (error: any) {
    console.error("❌ Error fetching assigned projects:", error.response?.status, error.response?.data, error.message);
    throw error;
  }
};
