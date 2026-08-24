import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(23,26,36,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
