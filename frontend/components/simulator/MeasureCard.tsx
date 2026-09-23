import { Check, Clock3, MapPin, Plus, WalletCards } from "lucide-react";
import type { IndicatorMeta, Measure } from "@/lib/types";
import { directionLabels, fmt } from "@/lib/format";

type Props = {
  measure: Measure;
  indicators: Record<string, IndicatorMeta>;
  districts: string[];
  selected: boolean;
  selectedDistrict?: string;
  disabledReason?: string;
  onDistrictChange: (measureId: string, district: string) => void;
  onAdd: (measure: Measure) => void;
};

export function MeasureCard({
  measure,
  indicators,
  districts,
  selected,
  selectedDistrict,
  disabledReason,
  onDistrictChange,
  onAdd,
}: Props) {
  const projected = measure.projected_effects ?? measure.effects;
  const districtRequired = measure.type === "district";
  const needsDistrict = districtRequired && !selectedDistrict;
  const canAdd = !disabledReason && !needsDistrict;

  return (
    <article className={`flex min-h-[320px] flex-col rounded-lg border p-4 transition ${selected ? "border-civic bg-civic/5" : "border-line bg-surface"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md bg-panel px-2 py-1 text-xs font-semibold text-civic">{directionLabels[measure.direction]}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
          <WalletCards size={16} className="text-signal" /> {measure.cost}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-6 text-ink">{measure.name}</h3>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={15} /> {districtRequired ? "Один район" : "Весь город"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={15} /> Через {measure.lag} кв.
        </span>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Эффект</div>
        <div className="mt-2 grid gap-1.5">
          {Object.entries(projected).map(([indicator, value]) => (
            <div key={indicator} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 text-muted">{indicators[indicator]?.label ?? indicator}</span>
              <strong className={value >= 0 ? "shrink-0 text-civic" : "shrink-0 text-alert"}>
                {value > 0 ? "+" : ""}{fmt(value, 1)}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
        {districtRequired && (
          <label className="mb-3 block text-sm font-medium text-ink">
            Район
            <select
              className="focus-ring mt-2 w-full rounded-md border border-line bg-panel px-3 py-2.5 text-ink disabled:opacity-60"
              value={selectedDistrict ?? ""}
              onChange={(event) => onDistrictChange(measure.id, event.target.value)}
              disabled={selected}
            >
              <option value="">Выберите район</option>
              {districts.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>
        )}

        <button
          className={`focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-semibold ${selected ? "border-civic/40 bg-civic/10 text-civic" : "border-line bg-panel text-ink hover:border-civic hover:text-civic disabled:cursor-not-allowed disabled:text-muted"}`}
          type="button"
          onClick={() => onAdd(measure)}
          disabled={!canAdd || selected}
          title={disabledReason || undefined}
        >
          {selected ? <Check size={18} /> : <Plus size={18} />}
          {selected ? "Проект добавлен" : "Добавить проект"}
        </button>
        {!selected && disabledReason && !needsDistrict && (
          <p className="mt-2 text-xs leading-5 text-alert">{disabledReason}</p>
        )}
      </div>
    </article>
  );
}
