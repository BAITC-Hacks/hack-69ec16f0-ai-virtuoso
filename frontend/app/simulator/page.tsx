"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Loader2, Play, RotateCcw } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { DistrictHeatmap } from "@/components/simulator/DistrictHeatmap";
import { CityMap } from "@/components/simulator/CityMap";
import { MeasureCard } from "@/components/simulator/MeasureCard";
import { DecisionSlots } from "@/components/simulator/DecisionSlots";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { getAnalysis, getConfig, simulateScenario, validateScenario } from "@/lib/api";
import { directionLabels } from "@/lib/format";
import type {
  AnalysisResponse,
  ConfigResponse,
  Decision,
  Direction,
  Measure,
  SimulateResponse,
  ValidationErrorItem,
} from "@/lib/types";

type DirectionFilter = "all" | Direction;

export default function SimulatorPage() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [teamName, setTeamName] = useState("Моя команда");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [districtDraft, setDistrictDraft] = useState<Record<string, string>>({});
  const [mapDistrict, setMapDistrict] = useState("");
  const [activeDirection, setActiveDirection] = useState<DirectionFilter>("all");
  const [errors, setErrors] = useState<ValidationErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulateResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | undefined>();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setApiError("Не удалось подключиться к симулятору. Проверьте, что backend запущен на порту 8000."))
      .finally(() => setLoading(false));
  }, []);

  const spent = useMemo(() => {
    if (!config) return 0;
    return decisions.reduce(
      (total, decision) => total + (config.measures.find((measure) => measure.id === decision.measure_id)?.cost ?? 0),
      0,
    );
  }, [config, decisions]);

  const directionCounts = useMemo(() => {
    const counts: Partial<Record<Direction, number>> = {};
    if (!config) return counts;
    decisions.forEach((decision) => {
      const direction = config.measures.find((measure) => measure.id === decision.measure_id)?.direction;
      if (direction) counts[direction] = (counts[direction] ?? 0) + 1;
    });
    return counts;
  }, [config, decisions]);

  const filteredMeasures = useMemo(() => {
    if (!config || activeDirection === "all") return config?.measures ?? [];
    return config.measures.filter((measure) => measure.direction === activeDirection);
  }, [activeDirection, config]);

  async function runValidation(nextDecisions: Decision[]) {
    try {
      const response = await validateScenario(nextDecisions, teamName);
      setErrors(response.errors.filter((error) => error.code !== "EXACTLY_FIVE_REQUIRED"));
    } catch {
      setErrors([]);
    }
  }

  function addMeasure(measure: Measure) {
    if (!config) return;
    const district = measure.type === "district" ? districtDraft[measure.id] ?? mapDistrict : null;
    if (blockedReason(measure, district)) return;

    const next = [...decisions, { measure_id: measure.id, district }];
    setDecisions(next);
    setSimulation(null);
    setAnalysis(undefined);
    setApiError(null);
    void runValidation(next);
  }

  function removeDecision(index: number) {
    const next = decisions.filter((_, decisionIndex) => decisionIndex !== index);
    setDecisions(next);
    setSimulation(null);
    setAnalysis(undefined);
    setApiError(null);
    void runValidation(next);
  }

  function resetScenario() {
    setDecisions([]);
    setDistrictDraft({});
    setMapDistrict("");
    setErrors([]);
    setSimulation(null);
    setAnalysis(undefined);
    setApiError(null);
  }

  function blockedReason(measure: Measure, district?: string | null): string | undefined {
    if (!config) return "Данные ещё загружаются.";
    if (decisions.length >= 5) return "Все пять решений уже выбраны.";
    if (decisions.some((decision) => decision.measure_id === measure.id)) return "Этот проект уже выбран.";
    if (spent + measure.cost > config.budget) return `Не хватает ${spent + measure.cost - config.budget} ед. бюджета.`;
    if ((directionCounts[measure.direction] ?? 0) >= 2) {
      return `Можно выбрать не больше двух проектов в направлении «${directionLabels[measure.direction]}».`;
    }
    if (measure.type === "district" && !district) return "Сначала выберите район.";

    for (const rule of config.incompatibilities) {
      const [first, second] = rule.measures;
      const paired = first === measure.id ? second : second === measure.id ? first : null;
      if (!paired) continue;
      const existing = decisions.find((decision) => decision.measure_id === paired);
      if (!existing) continue;
      if (rule.scope === "global") return rule.reason;
      if (rule.scope === "same_district" && existing.district && existing.district === district) return rule.reason;
    }
    return undefined;
  }

  const canSimulate = Boolean(config) && decisions.length === 5 && errors.length === 0 && spent <= (config?.budget ?? 0);

  async function simulate() {
    if (!canSimulate) return;
    setSimulating(true);
    setApiError(null);
    setAnalysis(undefined);

    try {
      const response = await simulateScenario(decisions, teamName.trim() || "Без названия");
      setSimulation(response);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

      try {
        setAnalysis(await getAnalysis(response.analysis_url));
      } catch {
        // The deterministic result remains useful when optional AI interpretation is unavailable.
      }
    } catch {
      setApiError("Не удалось рассчитать сценарий. Проверьте выбранные решения и попробуйте ещё раз.");
    } finally {
      setSimulating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <TopNav />
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 text-muted">
          <Loader2 className="mr-3 animate-spin" /> Загружаем данные города...
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-lg border border-alert/40 bg-alert/10 p-5 text-alert">{apiError}</div>
        </div>
      </main>
    );
  }

  const districtNames = config.districts.map((district) => district.name);
  const budgetPercent = Math.min((spent / config.budget) * 100, 100);
  const directions = Object.keys(directionLabels) as Direction[];

  return (
    <main className="min-h-screen pb-24 xl:pb-10">
      <TopNav />
      <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 lg:py-10">
        <header>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Астана. Пять решений.</h1>
          <p className="mt-3 text-sm text-muted">Бюджет: 100 · не больше двух проектов из одной сферы</p>
        </header>

        <CityMap
          districts={config.districts}
          decisions={decisions}
          selectedDistrict={mapDistrict}
          result={simulation?.result}
          baselineScore={config.baseline.score}
          onSelect={setMapDistrict}
        />

        {simulation && (
          <div ref={resultsRef} className="scroll-mt-24 pt-6">
            <ResultsPanel result={simulation.result} analysis={analysis} decisions={decisions} measures={config.measures} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="order-2 min-w-0 xl:order-1">
            <section className="rounded-lg border border-line bg-panel p-4 shadow-soft sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-ink">Проекты</h2>
                </div>
                <span className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-ink">Выбрано {decisions.length} из 5</span>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Фильтр направлений">
                <button
                  className={`focus-ring shrink-0 rounded-md px-3 py-2 text-sm font-medium ${activeDirection === "all" ? "bg-ink text-surface" : "border border-line bg-surface text-muted hover:text-ink"}`}
                  type="button"
                  onClick={() => setActiveDirection("all")}
                >
                  Все проекты
                </button>
                {directions.map((direction) => (
                  <button
                    key={direction}
                    className={`focus-ring shrink-0 rounded-md px-3 py-2 text-sm font-medium ${activeDirection === direction ? "bg-ink text-surface" : "border border-line bg-surface text-muted hover:text-ink"}`}
                    type="button"
                    onClick={() => setActiveDirection(direction)}
                  >
                    {directionLabels[direction]}
                    {directionCounts[direction] ? ` · ${directionCounts[direction]}` : ""}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {filteredMeasures.map((measure) => (
                  <MeasureCard
                    key={measure.id}
                    measure={measure}
                    indicators={config.indicators}
                    districts={districtNames}
                    selected={decisions.some((decision) => decision.measure_id === measure.id)}
                    selectedDistrict={decisions.find((decision) => decision.measure_id === measure.id)?.district ?? districtDraft[measure.id] ?? mapDistrict}
                    disabledReason={blockedReason(measure, measure.type === "district" ? districtDraft[measure.id] ?? mapDistrict : null)}
                    onDistrictChange={(measureId, district) => setDistrictDraft((current) => ({ ...current, [measureId]: district }))}
                    onAdd={addMeasure}
                  />
                ))}
              </div>
            </section>

            <details className="group mt-5 rounded-lg border border-line bg-panel">
              <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-4 font-medium text-ink sm:p-5">
                <span>Посмотреть исходное состояние районов</span>
                <ChevronDown className="text-muted transition group-open:rotate-180" size={20} />
              </summary>
              <div className="border-t border-line p-3 sm:p-5">
                <DistrictHeatmap districts={config.districts} indicators={config.indicators} embedded />
              </div>
            </details>
          </div>

          <aside className="order-1 min-w-0 xl:order-2">
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:sticky xl:top-24">
              <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Сценарий</h2>
                  </div>
                  {decisions.length > 0 && (
                    <button
                      className="focus-ring rounded-md p-2 text-muted hover:bg-surface hover:text-ink"
                      type="button"
                      onClick={resetScenario}
                      title="Очистить выбранные решения"
                      aria-label="Очистить сценарий"
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                </div>

                <label className="mt-4 block text-sm font-medium text-ink">
                  Название команды
                  <input
                    className="focus-ring mt-2 w-full rounded-md border border-line bg-surface px-3 py-3 text-ink placeholder:text-muted"
                    value={teamName}
                    maxLength={80}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Например, Команда 7"
                  />
                </label>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Бюджет</span>
                    <strong className="text-ink">{spent} из {config.budget}</strong>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-civic transition-all" style={{ width: `${budgetPercent}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-muted">Осталось {config.budget - spent}</div>
                </div>
              </section>

              <DecisionSlots decisions={decisions} measures={config.measures} onRemove={removeDecision} />

              {(errors.length > 0 || apiError) && (
                <div className="rounded-lg border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                    <div className="grid gap-1">
                      {errors.map((error) => <p key={`${error.code}-${error.message}`}>{error.message}</p>)}
                      {apiError && <p>{apiError}</p>}
                    </div>
                  </div>
                </div>
              )}

              <section className="hidden rounded-lg border border-line bg-panel p-4 xl:block">
                <div className="mb-3 flex items-center gap-2 text-sm">
                  {canSimulate ? <Check className="text-civic" size={18} /> : <span className="h-2 w-2 rounded-full bg-signal" />}
                  <span className={canSimulate ? "text-ink" : "text-muted"}>
                    {canSimulate ? "Всё готово к расчёту" : `Добавьте ещё ${5 - decisions.length} ${pluralDecisions(5 - decisions.length)}`}
                  </span>
                </div>
                <button
                  className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-civic px-5 py-4 font-semibold text-surface transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
                  type="button"
                  onClick={simulate}
                  disabled={!canSimulate || simulating}
                >
                  {simulating ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                  {simulating ? "Считаем результат..." : "Запустить симуляцию"}
                </button>
              </section>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">{decisions.length} из 5 решений</div>
            <div className="text-xs text-muted">Бюджет: {spent} / {config.budget}</div>
          </div>
          <button
            className="focus-ring inline-flex min-w-40 items-center justify-center gap-2 rounded-md bg-civic px-4 py-3 text-sm font-semibold text-surface disabled:bg-line disabled:text-muted"
            type="button"
            onClick={simulate}
            disabled={!canSimulate || simulating}
          >
            {simulating ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            {canSimulate ? "Рассчитать" : `Нужно ещё ${5 - decisions.length}`}
          </button>
        </div>
      </div>
    </main>
  );
}

function pluralDecisions(count: number) {
  if (count === 1) return "решение";
  if (count >= 2 && count <= 4) return "решения";
  return "решений";
}
