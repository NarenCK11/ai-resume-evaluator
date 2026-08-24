export type EducationLevel =
  | "none"
  | "high_school"
  | "associate"
  | "bachelor"
  | "master"
  | "doctorate";

export type JobStatus = "open" | "closed";

export type EvaluationStatus = "pending" | "evaluating" | "evaluated" | "failed";

export type Recommendation = "Strong Match" | "Good Match" | "Weak Match" | "Not a Match";

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface JobOpening {
  id: number;
  owner_id: number;
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
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobOpeningWithStats extends JobOpening {
  candidate_count: number;
  evaluated_count: number;
  top_score: number | null;
  average_score: number | null;
}

export interface ScoreComponent {
  score: number;
  weight: number;
  weighted_contribution: number;
}

export interface ScoreBreakdown {
  required_skills: ScoreComponent;
  preferred_skills: ScoreComponent;
  experience: ScoreComponent;
  education: ScoreComponent;
  job_description_fit: ScoreComponent;
  projects_certifications: ScoreComponent;
}

export interface Evaluation {
  id: number;
  candidate_id: number;
  overall_score: number;
  recommendation: Recommendation;
  score_breakdown: ScoreBreakdown;
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  strengths: string[];
  concerns: string[];
  summary: string;
  raw_evidence: Record<string, unknown>;
  created_at: string;
}

export interface Candidate {
  id: number;
  job_opening_id: number;
  full_name: string;
  email: string;
  phone: string;
  resume_filename: string;
  evaluation_status: EvaluationStatus;
  evaluation_error: string;
  created_at: string;
}

export interface CandidateWithEvaluation extends Candidate {
  latest_evaluation: Evaluation | null;
}

export interface RankedCandidate extends Candidate {
  rank: number;
  overall_score: number | null;
  recommendation: Recommendation | null;
}

export interface DashboardStats {
  total_job_openings: number;
  open_job_openings: number;
  total_candidates: number;
  evaluated_candidates: number;
  pending_candidates: number;
  failed_candidates: number;
  average_score: number | null;
  strong_matches: number;
  recent_candidates: {
    id: number;
    full_name: string;
    job_title: string;
    job_id: number;
    score: number | null;
    recommendation: Recommendation | null;
    evaluation_status: EvaluationStatus;
    created_at: string;
  }[];
}
