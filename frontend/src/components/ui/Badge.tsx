import clsx from "clsx";
import type { Recommendation } from "../../types";

const RECOMMENDATION_STYLES: Record<Recommendation, string> = {
  "Strong Match": "bg-success-50 text-success-700 ring-success-500/20",
  "Good Match": "bg-info-50 text-info-600 ring-info-500/20",
  "Weak Match": "bg-warning-50 text-warning-600 ring-warning-500/20",
  "Not a Match": "bg-danger-50 text-danger-600 ring-danger-500/20",
};

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset whitespace-nowrap",
        RECOMMENDATION_STYLES[recommendation],
      )}
    >
      {recommendation}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "info" | "warning" | "brand";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ink-100 text-ink-600 ring-ink-300/40",
    success: "bg-success-50 text-success-700 ring-success-500/20",
    danger: "bg-danger-50 text-danger-600 ring-danger-500/20",
    info: "bg-info-50 text-info-600 ring-info-500/20",
    warning: "bg-warning-50 text-warning-600 ring-warning-500/20",
    brand: "bg-brand-50 text-brand-700 ring-brand-500/20",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
