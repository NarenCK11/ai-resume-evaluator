import { apiClient } from "./client";
import type { DashboardStats } from "../types";

export async function getDashboardStats() {
  const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
  return data;
}
