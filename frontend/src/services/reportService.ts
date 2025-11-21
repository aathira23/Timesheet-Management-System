// src/services/reportService.ts
import api from "./api";

export const getReports = async (params?: any) => {
  const res = await api.get("/reports", { params });
  return res.data;
};
