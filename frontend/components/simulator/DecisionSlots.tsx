import { Building2, Trash2 } from "lucide-react";
import Image from "next/image";
import geometry from "@/lib/district-paths.json";
import type { Decision, Measure } from "@/lib/types";

type Props = {
  decisions: Decision[];
  measures: Measure[];
  onRemove: (index: number) => void;
};

export function DecisionSlots({ decisions, measures, onRemove }: Props) {
  return (
    <section className="min-w-0 rounded-lg border border-line bg-panel p-4 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-ink">Выбранные решения</h2>
        <span className="text-sm text-muted">{decisions.length} / 5</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {decisions.map((decision, index) => {
          const measure = measures.find((item) => item.id === decision.measure_id);
          if (!measure) return null;
          const region = geometry.find((item) => item.name === decision.district);
          return (
            <div key={index} className="flex min-h-14 min-w-0 items-center gap-3 rounded-md border border-line bg-surface p-2.5">
              {region ? (
                <Image src={`/map_icons/${region.asset}`} alt="" width={36} height={40} className="h-10 w-9 shrink-0" />
              ) : (
                <span className="flex h-10 w-9 shrink-0 items-center justify-center text-civic"><Building2 size={22} /></span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink" title={measure.name}>{measure.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <Building2 size={12} />
                  {decision.district || "Весь город"} · {measure.cost} ед.
                </div>
              </div>
              <button
                className="focus-ring shrink-0 rounded-md p-2 text-muted hover:bg-panel hover:text-alert"
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Удалить ${measure.name}`}
                title="Удалить решение"
              >
                <Trash2 size={17} />
              </button>
            </div>
          );
        })}
        {decisions.length < 5 && (
          <div className="flex h-11 items-center gap-3 rounded-md border border-dashed border-line px-3 text-sm text-muted">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs">{decisions.length + 1}</span>
            Добавьте ещё {5 - decisions.length}
          </div>
        )}
      </div>
    </section>
  );
}
