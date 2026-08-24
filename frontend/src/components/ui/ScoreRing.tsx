function bandColor(score: number) {
  if (score >= 85) return { track: "#d1fae5", stroke: "#059669", text: "text-success-700" };
  if (score >= 70) return { track: "#dbeafe", stroke: "#2563eb", text: "text-info-600" };
  if (score >= 50) return { track: "#fef3c7", stroke: "#d97706", text: "text-warning-600" };
  return { track: "#fee2e2", stroke: "#dc2626", text: "text-danger-600" };
}

export function ScoreRing({
  score,
  size = 88,
  strokeWidth = 8,
  label,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - progress);
  const colors = bandColor(score);

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.track} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${colors.text}`}>{Math.round(score)}</span>
        {label && <span className="text-[10px] font-medium text-ink-400">{label}</span>}
      </div>
    </div>
  );
}

export function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const colors = bandColor(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700">{label}</span>
        <span className="text-ink-400">
          <span className={`font-semibold ${colors.text}`}>{Math.round(score)}</span> / 100
          <span className="ml-1.5 text-xs text-ink-300">({Math.round(weight * 100)}% weight)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: colors.stroke }}
        />
      </div>
    </div>
  );
}
