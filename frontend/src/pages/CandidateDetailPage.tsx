import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Badge, RecommendationBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ScoreBar, ScoreRing } from "../components/ui/ScoreRing";
import { EmptyState } from "../components/ui/EmptyState";
import { getCandidate, deleteCandidate, reevaluateCandidate } from "../api/candidates";
import { getErrorMessage } from "../api/client";
import type { CandidateWithEvaluation } from "../types";

const BREAKDOWN_LABELS: Record<string, string> = {
  required_skills: "Required Skills Match",
  preferred_skills: "Preferred Skills Match",
  experience: "Relevant Experience",
  education: "Education Fit",
  job_description_fit: "Overall JD Fit",
  projects_certifications: "Projects & Certifications",
};

export default function CandidateDetailPage() {
  const { jobId, candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateWithEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reevaluating, setReevaluating] = useState(false);

  const load = () => {
    setLoading(true);
    getCandidate(Number(candidateId))
      .then(setCandidate)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [candidateId]);

  const handleReevaluate = async () => {
    setReevaluating(true);
    try {
      const updated = await reevaluateCandidate(Number(candidateId));
      setCandidate(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReevaluating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${candidate?.full_name}? This cannot be undone.`)) return;
    await deleteCandidate(Number(candidateId));
    navigate(`/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="h-64 animate-pulse rounded-2xl bg-ink-100" />
      </AppLayout>
    );
  }

  if (!candidate) {
    return (
      <AppLayout>
        <EmptyState title="Candidate not found" description={error} />
      </AppLayout>
    );
  }

  const evalu = candidate.latest_evaluation;

  return (
    <AppLayout>
      <Link
        to={`/jobs/${jobId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to candidate ranking
      </Link>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {candidate.full_name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-900">{candidate.full_name}</h1>
              <p className="text-sm text-ink-500">
                {[candidate.email, candidate.phone].filter(Boolean).join(" · ") || candidate.resume_filename}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={reevaluating} onClick={handleReevaluate}>
              Re-evaluate
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Remove
            </Button>
          </div>
        </div>
      </Card>

      {error && <div className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</div>}

      {candidate.evaluation_status === "failed" && (
        <Card className="mb-6 p-6">
          <EmptyState
            title="Evaluation failed"
            description={candidate.evaluation_error || "Something went wrong while evaluating this resume."}
            action={
              <Button size="sm" loading={reevaluating} onClick={handleReevaluate}>
                Try again
              </Button>
            }
          />
        </Card>
      )}

      {!evalu && candidate.evaluation_status !== "failed" && (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
          <p className="text-sm font-medium text-ink-600">Evaluation in progress…</p>
        </Card>
      )}

      {evalu && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center p-6 lg:col-span-1">
            <ScoreRing score={evalu.overall_score} size={140} strokeWidth={12} label="/ 100" />
            <div className="mt-4">
              <RecommendationBadge recommendation={evalu.recommendation} />
            </div>
            <p className="mt-4 text-center text-sm leading-relaxed text-ink-500">{evalu.summary}</p>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Score Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(evalu.score_breakdown).map(([key, comp]) => (
                <ScoreBar key={key} label={BREAKDOWN_LABELS[key] ?? key} score={comp.score} weight={comp.weight} />
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Matching Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {[...evalu.matched_required_skills, ...evalu.matched_preferred_skills].length === 0 ? (
                <p className="text-sm text-ink-400">No matching skills detected.</p>
              ) : (
                <>
                  {evalu.matched_required_skills.map((s) => (
                    <Badge key={`req-${s}`} tone="success">
                      {s}
                    </Badge>
                  ))}
                  {evalu.matched_preferred_skills.map((s) => (
                    <Badge key={`pref-${s}`} tone="info">
                      {s}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Missing Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {[...evalu.missing_required_skills, ...evalu.missing_preferred_skills].length === 0 ? (
                <p className="text-sm text-ink-400">No missing skills — great coverage!</p>
              ) : (
                <>
                  {evalu.missing_required_skills.map((s) => (
                    <Badge key={`mreq-${s}`} tone="danger">
                      {s}
                    </Badge>
                  ))}
                  {evalu.missing_preferred_skills.map((s) => (
                    <Badge key={`mpref-${s}`} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-success-600">
              Strengths
            </h2>
            <ul className="space-y-2">
              {evalu.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-600">
                  <span className="mt-0.5 text-success-500">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-warning-600">
              Concerns
            </h2>
            <ul className="space-y-2">
              {evalu.concerns.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-600">
                  <span className="mt-0.5 text-warning-500">!</span>
                  {c}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
