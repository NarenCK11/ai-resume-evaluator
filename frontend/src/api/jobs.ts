import { apiClient } from "./client";
import type { EducationLevel, JobOpening, JobOpeningWithStats, JobStatus } from "../types";

export interface JobOpeningInput {
  title: string;
  department: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number;
  max_experience_years: number | null;
  education_requirement: EducationLevel;
  location: string;
  employment_type: string;
  other_details: string;
}

export async function listJobs() {
  const { data } = await apiClient.get<JobOpeningWithStats[]>("/jobs");
  return data;
}

export async function getJob(jobId: number) {
  const { data } = await apiClient.get<JobOpeningWithStats>(`/jobs/${jobId}`);
  return data;
}

export async function createJob(payload: JobOpeningInput) {
  const { data } = await apiClient.post<JobOpening>("/jobs", payload);
  return data;
}

export async function updateJob(jobId: number, payload: Partial<JobOpeningInput & { status: JobStatus }>) {
  const { data } = await apiClient.patch<JobOpening>(`/jobs/${jobId}`, payload);
  return data;
}

export async function deleteJob(jobId: number) {
  await apiClient.delete(`/jobs/${jobId}`);
}
