"use client";

import { Check, X } from "lucide-react";
import geometry from "@/lib/district-paths.json";
import { fmt, signed } from "@/lib/format";
import type { Decision, District, ScenarioResult } from "@/lib/types";

type Props = {
  districts: District[];
  decisions: Decision[];
  selectedDistrict: string;
  result?: ScenarioResult;
  baselineScore: number;
  onSelect: (district: string) => void;
};

export function CityMap({ districts, decisions, selectedDistrict, result, baselineScore, onSelect }: Props) {
  const cityProjects = decisions.filter((decision) => !decision.district).length;
  const selectedAsset = geometry.find((region) => region.name === selectedDistrict)?.asset ?? "map.svg";

  return (
    <section className="city-map-section" aria-label="Карта районов Астаны">
      <div className="city-map-stage">
        <span className="city-map-index">05 <span>районов</span></span>
        <svg viewBox="0 0 226 250" className="city-map-svg" aria-label="Выбор района на карте">
          <image
            href="/map_icons/map.svg"
            width="226"
            height="250"
            className="city-map-image"
            data-active={selectedAsset === "map.svg"}
            pointerEvents="none"
            aria-hidden="true"
          />
          {geometry.map((region) => (
            <image
              key={region.name}
              href={`/map_icons/${region.asset}`}
              width="226"
              height="250"
              className="city-map-image"
              data-active={selectedAsset === region.asset}
              pointerEvents="none"
              aria-hidden="true"
            />
          ))}
          {geometry.map((region) => {
            const district = districts.find((item) => item.name === region.name);
            if (!district) return null;
            const selected = selectedDistrict === region.name;

            return (
              <path
                key={region.name}
                d={region.path}
                className="city-map-region"
                role="button"
                tabIndex={0}
                aria-label={`Выбрать район ${region.name}`}
                aria-pressed={selected}
                onClick={() => onSelect(region.name)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(region.name);
                  }
                }}
              >
                <title>{region.name} · {fmt(result?.districts[region.name]?.score ?? district.score)} балла</title>
              </path>
            );
          })}
        </svg>
      </div>

      <div className="city-map-districts">
        <div className="city-map-score">
          <div className="city-map-kicker">Оценка города{result ? " · после" : ""}</div>
          <div className="flex items-baseline gap-3">
            <strong className="city-map-score-value">{fmt(result?.score ?? baselineScore)}</strong>
            {result && <span className="text-sm font-semibold text-civic">{signed(result.delta)}</span>}
          </div>
        </div>
        <div className="city-map-table-heading">
          <span>Районы</span>
          <span>Баллы</span>
        </div>
        <div className="city-map-list">
          {districts.map((district) => {
            const count = decisions.filter((decision) => decision.district === district.name).length;
            const selected = selectedDistrict === district.name;
            const index = districts.indexOf(district) + 1;
            return (
              <button
                key={district.name}
                type="button"
                className="city-map-district"
                aria-pressed={selected}
                aria-label={`Район ${district.name}`}
                onClick={() => onSelect(district.name)}
              >
                <span className="city-map-row-number">{String(index).padStart(2, "0")}</span>
                <span className="city-map-row-name">{district.name}</span>
                {count > 0 && <span className="city-map-row-count" title="Районных проектов">{count} пр.</span>}
                <span className="city-map-row-score">{fmt(result?.districts[district.name]?.score ?? district.score, 1)}</span>
                <span className="city-map-row-check">{selected && <Check size={17} />}</span>
              </button>
            );
          })}
        </div>
        <div className="city-map-footer">
          <span>{selectedDistrict ? `Для новых проектов: ${selectedDistrict}` : "Выберите район"}</span>
          {selectedDistrict && (
            <button type="button" className="city-map-clear" onClick={() => onSelect("")} title="Снять выбор" aria-label="Снять выбор">
              <X size={16} />
            </button>
          )}
        </div>
        {cityProjects > 0 && <span className="city-map-city-count">Для всего города: {cityProjects}</span>}
      </div>
    </section>
  );
}
