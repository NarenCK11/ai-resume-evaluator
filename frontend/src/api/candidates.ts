import { apiClient } from "./client";
import type { CandidateWithEvaluation, RankedCandidate } from "../types";

export async function listCandidates(jobId: number) {
  const { data } = await apiClient.get<RankedCandidate[]>(`/jobs/${jobId}/candidates`);
  return data;
}

export async function getCandidate(candidateId: number) {
  const { data } = await apiClient.get<CandidateWithEvaluation>(`/candidates/${candidateId}`);
  return data;
}

export async function addCandidate(
  jobId: number,
  payload: { full_name: string; email: string; phone: string; resume: File },
) {
  const form = new FormData();
  form.append("full_name", payload.full_name);
  form.append("email", payload.email);
  form.append("phone", payload.phone);
  form.append("resume", payload.resume);

  const { data } = await apiClient.post<CandidateWithEvaluation>(
    `/jobs/${jobId}/candidates`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function reevaluateCandidate(candidateId: number) {
  const { data } = await apiClient.post<CandidateWithEvaluation>(
    `/candidates/${candidateId}/reevaluate`,
  );
  return data;
}

export async function deleteCandidate(candidateId: number) {
  await apiClient.delete(`/candidates/${candidateId}`);
}
