import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { TableRowSkeleton } from "../components/ui/Skeleton";
import { RankingTable } from "../components/candidates/RankingTable";
import { AddCandidateModal } from "../components/candidates/AddCandidateModal";
import { JobFormModal } from "../components/jobs/JobFormModal";
import { deleteJob, getJob, updateJob } from "../api/jobs";
import { addCandidate, deleteCandidate, listCandidates, reevaluateCandidate } from "../api/candidates";
import { getErrorMessage } from "../api/client";
import type { JobOpeningWithStats, RankedCandidate } from "../types";
import type { JobOpeningInput } from "../api/jobs";

export default function JobDetailPage() {
  const { jobId } = useParams();
  const id = Number(jobId);
  const navigate = useNavigate();

  const [job, setJob] = useState<JobOpeningWithStats | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reevaluatingId, setReevaluatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [jobData, candidateData] = await Promise.all([getJob(id), listCandidates(id)]);
      setJob(jobData);
      setCandidates(candidateData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(id)) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter((c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [candidates, search]);

  const handleAddCandidate = async (payload: { full_name: string; email: string; phone: string; resume: File }) => {
    await addCandidate(id, payload);
    await loadAll();
  };

  const handleDelete = async (candidateId: number) => {
    if (!window.confirm("Remove this candidate? This cannot be undone.")) return;
    setDeletingId(candidateId);
    try {
      await deleteCandidate(candidateId);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      setJob((prev) => (prev ? { ...prev, candidate_count: prev.candidate_count - 1 } : prev));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleReevaluate = async (candidateId: number) => {
    setReevaluatingId(candidateId);
    try {
      await reevaluateCandidate(candidateId);
      const updated = await listCandidates(id);
      setCandidates(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReevaluatingId(null);
    }
  };

  const handleEditJob = async (payload: JobOpeningInput) => {
    await updateJob(id, payload);
    await loadAll();
  };

  const handleToggleStatus = async () => {
    if (!job) return;
    await updateJob(id, { status: job.status === "open" ? "closed" : "open" });
    loadAll();
  };

  const handleDeleteJob = async () => {
    if (!window.confirm(`Delete "${job?.title}" and all its candidates? This cannot be undone.`)) return;
    await deleteJob(id);
    navigate("/jobs");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="mb-6 h-32 animate-pulse rounded-2xl bg-ink-100" />
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <EmptyState title="Job opening not found" description={error || "It may have been deleted."} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link to="/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Job Openings
      </Link>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-ink-900">{job.title}</h1>
              <Badge tone={job.status === "open" ? "success" : "neutral"} className="capitalize">
                {job.status}
              </Badge>
            </div>
            <p className="text-sm text-ink-500">
              {[job.department, job.location, job.employment_type].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
              Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={handleToggleStatus}>
              {job.status === "open" ? "Close role" : "Reopen role"}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteJob}>
              Delete
            </Button>
            <Button size="sm" onClick={() => setAddModalOpen(true)}>
              + Add Candidate
            </Button>
          </div>
        </div>

        {job.description && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-600">{job.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-100 pt-5 sm:grid-cols-4">
          <MetaStat label="Candidates" value={job.candidate_count} />
          <MetaStat label="Evaluated" value={job.evaluated_count} />
          <MetaStat label="Top score" value={job.top_score !== null ? Math.round(job.top_score) : "—"} />
          <MetaStat label="Avg. score" value={job.average_score !== null ? Math.round(job.average_score) : "—"} />
        </div>

        {(job.required_skills.length > 0 || job.preferred_skills.length > 0) && (
          <div className="mt-5 space-y-2.5 border-t border-ink-100 pt-5">
            {job.required_skills.length > 0 && (
              <SkillRow label="Required" skills={job.required_skills} tone="brand" />
            )}
            {job.preferred_skills.length > 0 && (
              <SkillRow label="Preferred" skills={job.preferred_skills} tone="info" />
            )}
            <p className="text-xs text-ink-400">
              {job.min_experience_years > 0 && `${job.min_experience_years}+ yrs experience · `}
              {job.education_requirement !== "none" &&
                `${job.education_requirement.replace("_", " ")} degree required`}
            </p>
          </div>
        )}
      </Card>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-800">Candidate Ranking</h2>
        <div className="relative">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates…"
            className="w-64 rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</div>}

      {candidates.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No candidates yet"
          description="Add a candidate and upload their resume to get an instant AI-backed evaluation and ranking."
          action={<Button onClick={() => setAddModalOpen(true)}>+ Add Candidate</Button>}
        />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState title="No matching candidates" description="Try a different search term." />
      ) : (
        <RankingTable
          candidates={filteredCandidates}
          jobId={id}
          onDelete={handleDelete}
          onReevaluate={handleReevaluate}
          deletingId={deletingId}
          reevaluatingId={reevaluatingId}
        />
      )}

      <AddCandidateModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSubmit={handleAddCandidate} />
      <JobFormModal open={editModalOpen} onClose={() => setEditModalOpen(false)} onSubmit={handleEditJob} initial={job} />
    </AppLayout>
  );
}

function MetaStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-800">{value}</p>
    </div>
  );
}

function SkillRow({ label, skills, tone }: { label: string; skills: string[]; tone: "brand" | "info" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}:</span>
      {skills.map((skill) => (
        <Badge key={skill} tone={tone}>
          {skill}
        </Badge>
      ))}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
