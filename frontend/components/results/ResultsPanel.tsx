"use client";

import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Maximize2 } from "lucide-react";
import type { AnalysisResponse, Decision, Measure, ScenarioResult } from "@/lib/types";
import { fmt, signed } from "@/lib/format";
import { PresentationModal } from "./PresentationModal";
import { useState } from "react";

type Props = {
  result: ScenarioResult;
  analysis?: AnalysisResponse;
  decisions: Decision[];
  measures: Measure[];
};

export function ResultsPanel({ result, analysis, decisions, measures }: Props) {
  const [presentationOpen, setPresentationOpen] = useState(false);
  const chartData = Object.entries(result.districts).map(([name, district]) => ({
    name,
    before: Number(district.baseline_score.toFixed(2)),
    after: Number(district.score.toFixed(2))
  }));

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Результат</h2>
        </div>
        <button
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          type="button"
          onClick={() => setPresentationOpen(true)}
        >
          <Maximize2 size={16} />
          На весь экран
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-surface p-4">
          <div className="text-sm text-muted">Оценка города</div>
          <div className="mt-1 text-4xl font-semibold text-civic">{fmt(result.score)} <span className="text-base font-normal text-muted">из 100</span></div>
        </div>
        <div className="rounded-md bg-surface p-4">
          <div className="text-sm text-muted">Изменение</div>
          <div className="mt-1 text-4xl font-semibold text-skyline">{signed(result.delta)}</div>
        </div>
        <div className="rounded-md bg-surface p-4">
          <div className="text-sm text-muted">Район, которому нужно внимание</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{result.weakest_district.name}</div>
          <div className="text-sm text-muted">{fmt(result.weakest_district.score)}</div>
        </div>
      </div>
      <div className="mt-5 h-72 rounded-md bg-surface p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid stroke="#2a313a" vertical={false} />
            <XAxis dataKey="name" stroke="#99a4b1" />
            <YAxis stroke="#99a4b1" domain={[45, 66]} />
            <Tooltip contentStyle={{ background: "#171b21", border: "1px solid #2a313a", color: "#eef3f7" }} />
            <Bar dataKey="before" fill="#78a9ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="after" fill="#3dd6a3" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-5 rounded-md border border-line bg-surface p-4">
        <summary className="cursor-pointer font-semibold text-ink">Как рассчитан результат?</summary>
        <div className="mt-4 font-mono text-sm leading-7 text-muted">
          0.7 × {fmt(result.breakdown.formula.d_avg, 4)} + 0.3 × {fmt(result.breakdown.formula.weakest_district_score, 4)} − {result.breakdown.formula.n_crit} = <span className="text-civic">{fmt(result.score, 5)}</span>
        </div>
        <div className="mt-3 text-sm text-muted">Синергии: {result.breakdown.synergies.length || "нет"}</div>
      </details>
      <div className="mt-5 rounded-md border border-line bg-surface p-4">
        <h3 className="font-semibold text-ink">Разбор</h3>
        {analysis ? (
          <div className="mt-2 text-sm leading-6 text-muted">
            <p>{analysis.summary}</p>
            <p className="mt-2 text-ink">{analysis.trade_off}</p>
            {analysis.recommendations.length > 0 && (
              <ul className="mt-3 grid gap-2">
                {analysis.recommendations.map((item) => <li key={`${item.replace.measure_id}-${item.with.measure_id}`} className="rounded bg-panel p-3">{item.message}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Готовим пояснение к результату...</p>
        )}
      </div>
      {presentationOpen && (
        <PresentationModal
          result={result}
          analysis={analysis}
          decisions={decisions}
          measures={measures}
          onClose={() => setPresentationOpen(false)}
        />
      )}
    </section>
  );
}
