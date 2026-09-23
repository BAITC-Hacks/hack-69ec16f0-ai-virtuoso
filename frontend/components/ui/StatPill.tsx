import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
};

const tones = {
  default: "border-line bg-panel text-ink",
  good: "border-civic/40 bg-civic/10 text-civic",
  warn: "border-signal/40 bg-signal/10 text-signal",
  bad: "border-alert/40 bg-alert/10 text-alert"
};

export function StatPill({ label, value, tone = "default" }: Props) {
  return (
    <div className={`rounded-md border px-4 py-3 ${tones[tone]}`}>
      <div className="text-xs uppercase tracking-[0.16em] opacity-75">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
