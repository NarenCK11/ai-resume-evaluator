import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink-50">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 px-12 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12), transparent 45%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-bold backdrop-blur">
            T
          </div>
          <span className="text-lg font-bold">TalentScope</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Screen resumes with explainable, consistent scoring.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Create job openings, upload resumes, and let structured AI evidence combined with a
            deterministic scoring engine rank every candidate out of 100 — automatically.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-sm text-brand-100">
            <Feature text="Synonym-aware skill matching" />
            <Feature text="Deterministic, explainable /100 scores" />
            <Feature text="Rankings update automatically as candidates are added" />
          </div>
        </div>

        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} TalentScope</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {text}
    </div>
  );
}
