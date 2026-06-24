import React from "react";

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
      {sub && <p className="text-[13.5px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-[21px] font-semibold mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-[11.5px] text-gray-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "blue" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-50 text-green-700",
    blue: "bg-accent-soft text-accent",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Bar({ value, max, tone = "#2f5fe0" }: { value: number; max: number; tone?: string }) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: tone }} />
    </div>
  );
}
