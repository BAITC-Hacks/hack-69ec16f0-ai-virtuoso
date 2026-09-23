import type { District, IndicatorMeta } from "@/lib/types";
import { fmt } from "@/lib/format";

type Props = {
  districts: District[];
  indicators: Record<string, IndicatorMeta>;
  embedded?: boolean;
};

function heatClass(value: number) {
  if (value < 40) return "bg-alert/35 text-ink ring-1 ring-alert/70";
  if (value < 50) return "bg-signal/20 text-signal";
  if (value < 65) return "bg-skyline/15 text-ink";
  return "bg-civic/15 text-civic";
}

export function DistrictHeatmap({ districts, indicators, embedded = false }: Props) {
  const indicatorIds = Object.keys(indicators);
  const content = (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Исходные показатели</h2>
        </div>
        <span className="shrink-0 rounded-md border border-line px-3 py-2 text-sm text-muted">Оценка 52,56</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-2">Район</th>
              {indicatorIds.map((indicator) => <th key={indicator} className="px-2 py-2">{indicator}</th>)}
              <th className="px-2 py-2">Итог</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((district) => (
              <tr key={district.name}>
                <th className="w-36 rounded-md bg-surface px-2 py-3 text-left font-medium text-ink">
                  {district.name}
                  <span className="block text-xs font-normal text-muted">{district.profile}</span>
                </th>
                {indicatorIds.map((indicator) => (
                  <td
                    key={indicator}
                    title={indicators[indicator].label}
                    className={`rounded-md px-2 py-3 text-center font-semibold ${heatClass(district.indicators[indicator])}`}
                  >
                    {fmt(district.indicators[indicator], 0)}
                  </td>
                ))}
                <td className="rounded-md bg-surface px-2 py-3 text-center font-semibold text-ink">{fmt(district.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (embedded) return content;
  return <section className="rounded-lg border border-line bg-panel p-4 shadow-soft">{content}</section>;
}
