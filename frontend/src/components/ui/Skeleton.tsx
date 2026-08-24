import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-ink-100", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/2" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-3 w-full" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-ink-100 px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="mt-2 h-3 w-1/5" />
      </div>
      <Skeleton className="h-8 w-14 rounded-full" />
    </div>
  );
}
