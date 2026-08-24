import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Skeleton";
import { JobCard } from "../components/jobs/JobCard";
import { JobFormModal } from "../components/jobs/JobFormModal";
import { createJob, listJobs } from "../api/jobs";
import type { JobOpeningWithStats } from "../types";
import type { JobOpeningInput } from "../api/jobs";

type StatusFilter = "all" | "open" | "closed";

export default function JobsListPage() {
  const [jobs, setJobs] = useState<JobOpeningWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    listJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          job.title.toLowerCase().includes(q) ||
          job.department.toLowerCase().includes(q) ||
          job.required_skills.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [jobs, search, statusFilter]);

  const handleCreate = async (payload: JobOpeningInput) => {
    await createJob(payload);
    load();
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Job Openings</h1>
          <p className="mt-1 text-sm text-ink-500">Manage roles and review ranked candidates.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Job Opening</Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, department, or skill…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
          {(["all", "open", "closed"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                statusFilter === s ? "bg-white text-ink-800 shadow-sm" : "text-ink-500 hover:text-ink-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        jobs.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon />}
            title="No job openings yet"
            description="Create your first job opening to start uploading and ranking candidate resumes."
            action={<Button onClick={() => setModalOpen(true)}>+ New Job Opening</Button>}
          />
        ) : (
          <EmptyState title="No matching job openings" description="Try a different search or filter." />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      <JobFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </AppLayout>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
