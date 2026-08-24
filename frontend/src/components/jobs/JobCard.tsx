import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { JobOpeningWithStats } from "../../types";

export function JobCard({ job }: { job: JobOpeningWithStats }) {
  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-ink-900/5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink-900 group-hover:text-brand-700">{job.title}</h3>
            {job.department && <p className="mt-0.5 text-sm text-ink-500">{job.department}</p>}
          </div>
          <Badge tone={job.status === "open" ? "success" : "neutral"} className="shrink-0 capitalize">
            {job.status}
          </Badge>
        </div>

        {job.description && (
          <p className="mb-4 line-clamp-2 text-sm text-ink-500">{job.description}</p>
        )}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {job.required_skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
              {skill}
            </span>
          ))}
          {job.required_skills.length > 4 && (
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500">
              +{job.required_skills.length - 4} more
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
          <span className="text-ink-500">
            <span className="font-semibold text-ink-800">{job.candidate_count}</span> candidate
            {job.candidate_count === 1 ? "" : "s"}
          </span>
          {job.top_score !== null ? (
            <span className="font-semibold text-success-600">Top {Math.round(job.top_score)}</span>
          ) : (
            <span className="text-ink-400">No scores yet</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
