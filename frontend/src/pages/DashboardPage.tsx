import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { RecommendationBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { getDashboardStats } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";
import type { DashboardStats } from "../types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-ink-500">
            Here's how your open roles and candidate pipeline are looking.
          </p>
        </div>
        <Link to="/jobs">
          <Button>+ New Job Opening</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-8 w-16" />
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Open Job Openings"
              value={stats.open_job_openings}
              sub={`${stats.total_job_openings} total`}
              tone="brand"
            />
            <StatCard
              label="Total Candidates"
              value={stats.total_candidates}
              sub={`${stats.evaluated_candidates} evaluated`}
              tone="info"
            />
            <StatCard
              label="Strong Matches"
              value={stats.strong_matches}
              sub="across all roles"
              tone="success"
            />
            <StatCard
              label="Average Score"
              value={stats.average_score !== null ? Math.round(stats.average_score) : "—"}
              sub="out of 100"
              tone="warning"
            />
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-base font-semibold text-ink-800">Recently added candidates</h2>
            {stats.recent_candidates.length === 0 ? (
              <EmptyState
                title="No candidates yet"
                description="Create a job opening and upload resumes to see candidates ranked here."
                action={
                  <Link to="/jobs">
                    <Button size="sm">Go to Job Openings</Button>
                  </Link>
                }
              />
            ) : (
              <Card className="overflow-hidden">
                <ul className="divide-y divide-ink-100">
                  {stats.recent_candidates.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/jobs/${c.job_id}/candidates/${c.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ink-50"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                            {c.full_name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink-800">{c.full_name}</p>
                            <p className="truncate text-xs text-ink-400">{c.job_title}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {c.recommendation ? (
                            <RecommendationBadge recommendation={c.recommendation} />
                          ) : (
                            <span className="text-xs font-medium text-ink-400">
                              {c.evaluation_status === "failed" ? "Evaluation failed" : "Evaluating…"}
                            </span>
                          )}
                          {c.score !== null && (
                            <span className="w-10 text-right text-sm font-bold text-ink-800">
                              {Math.round(c.score)}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  sub: string;
  tone: "brand" | "info" | "success" | "warning";
}) {
  const tones: Record<string, string> = {
    brand: "text-brand-600",
    info: "text-info-600",
    success: "text-success-600",
    warning: "text-warning-600",
  };
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-400">{sub}</p>
    </Card>
  );
}
