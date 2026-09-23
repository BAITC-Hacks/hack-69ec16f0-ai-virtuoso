import { X } from "lucide-react";
import type { AnalysisResponse, Decision, Measure, ScenarioResult } from "@/lib/types";
import { fmt, signed } from "@/lib/format";

type Props = {
  result: ScenarioResult;
  analysis?: AnalysisResponse;
  decisions: Decision[];
  measures: Measure[];
  onClose: () => void;
};

export function PresentationModal({ result, analysis, decisions, measures, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-5xl rounded-lg border border-line bg-surface p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-civic">AKIM OS</p>
            <h2 className="mt-2 text-4xl font-semibold text-ink">Scenario briefing</h2>
          </div>
          <button className="focus-ring rounded-md p-2 text-muted hover:text-ink" type="button" onClick={onClose} aria-label="Закрыть">
            <X size={24} />
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-md bg-panel p-5">
            <div className="text-sm text-muted">Score</div>
            <div className="mt-2 text-5xl font-semibold text-civic">{fmt(result.score)}</div>
            <div className="mt-2 text-skyline">{signed(result.delta)} к baseline</div>
          </div>
          <div className="rounded-md bg-panel p-5">
            <div className="text-sm text-muted">Before / after</div>
            <div className="mt-2 text-2xl text-ink">{fmt(result.baseline_score)} → {fmt(result.score)}</div>
            <div className="mt-2 text-sm text-muted">N_crit: {result.n_crit}</div>
          </div>
          <div className="rounded-md bg-panel p-5">
            <div className="text-sm text-muted">Trade-off</div>
            <div className="mt-2 text-sm leading-6 text-ink">{analysis?.trade_off ?? "Анализ ещё загружается."}</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {decisions.map((decision, index) => {
            const measure = measures.find((item) => item.id === decision.measure_id);
            return (
              <div key={`${decision.measure_id}-${index}`} className="rounded-md border border-line bg-panel p-3">
                <div className="text-xs uppercase text-muted">Decision {index + 1}</div>
                <div className="mt-1 font-semibold text-ink">{decision.measure_id}</div>
                <div className="mt-1 text-xs text-muted">{measure?.name}</div>
                <div className="mt-2 text-sm text-civic">{decision.district ?? "city"}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-lg leading-8 text-ink">{analysis?.summary ?? "Deterministic result рассчитан. AI interpretation можно запросить отдельно."}</p>
      </div>
    </div>
  );
}
