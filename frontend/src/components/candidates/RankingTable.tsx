import { Link } from "react-router-dom";
import clsx from "clsx";
import { RecommendationBadge } from "../ui/Badge";
import type { RankedCandidate } from "../../types";

function RankPill({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white"
      : rank === 2
        ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
        : rank === 3
          ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white"
          : "bg-ink-100 text-ink-500";
  return (
    <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", styles)}>
      {rank}
    </div>
  );
}

export function RankingTable({
  candidates,
  jobId,
  onDelete,
  onReevaluate,
  deletingId,
  reevaluatingId,
}: {
  candidates: RankedCandidate[];
  jobId: number;
  onDelete: (candidateId: number) => void;
  onReevaluate: (candidateId: number) => void;
  deletingId: number | null;
  reevaluatingId: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3 font-semibold">Rank</th>
              <th className="px-5 py-3 font-semibold">Candidate</th>
              <th className="px-5 py-3 font-semibold">Score</th>
              <th className="px-5 py-3 font-semibold">Recommendation</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                <td className="px-5 py-3.5">{c.rank > 0 ? <RankPill rank={c.rank} /> : <span className="pl-2 text-ink-300">—</span>}</td>
                <td className="px-5 py-3.5">
                  <Link to={`/jobs/${jobId}/candidates/${c.id}`} className="group flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {c.full_name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-800 group-hover:text-brand-700">{c.full_name}</p>
                      <p className="truncate text-xs text-ink-400">{c.email || c.resume_filename}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  {c.overall_score !== null ? (
                    <span className="text-base font-bold text-ink-800">{Math.round(c.overall_score)}</span>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {c.recommendation ? <RecommendationBadge recommendation={c.recommendation} /> : <span className="text-ink-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill status={c.evaluation_status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onReevaluate(c.id)}
                      disabled={reevaluatingId === c.id}
                      title="Re-evaluate"
                      className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 disabled:opacity-50"
                    >
                      {reevaluatingId === c.id ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <RefreshIcon />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      disabled={deletingId === c.id}
                      title="Remove candidate"
                      className="rounded-lg p-2 text-ink-400 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: RankedCandidate["evaluation_status"] }) {
  if (status === "evaluated") return <span className="text-xs font-medium text-success-600">Evaluated</span>;
  if (status === "failed") return <span className="text-xs font-medium text-danger-600">Failed</span>;
  if (status === "evaluating")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Evaluating
      </span>
    );
  return <span className="text-xs font-medium text-ink-400">Pending</span>;
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
