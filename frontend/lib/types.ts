export type Direction = "transport" | "ecology" | "social" | "safety" | "services";
export type MeasureType = "district" | "city";

export type IndicatorMeta = {
  direction: Direction;
  label: string;
  weight: number;
};

export type District = {
  name: string;
  population_share: number;
  profile: string;
  indicators: Record<string, number>;
  score: number;
  critical_indicators: string[];
};

export type Measure = {
  id: string;
  direction: Direction;
  name: string;
  type: MeasureType;
  cost: number;
  lag: number;
  effects: Record<string, number>;
  realization_factor?: number;
  projected_effects?: Record<string, number>;
};

export type Decision = {
  measure_id: string;
  district?: string | null;
};

export type ValidationErrorItem = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

export type ValidationResponse = {
  valid: boolean;
  spent_budget: number;
  remaining_budget: number;
  errors: ValidationErrorItem[];
};

export type ScenarioResult = {
  dataset_version: string;
  score: number;
  display_score: number;
  baseline_score: number;
  delta: number;
  display_delta: number;
  d_avg: number;
  weakest_district: { name: string; score: number };
  n_crit: number;
  districts: Record<string, {
    population_share: number;
    profile: string;
    indicators: Record<string, number>;
    score: number;
    baseline_score: number;
    delta: number;
    critical_indicators: string[];
  }>;
  breakdown: {
    regular_effects: Array<Record<string, string | number>>;
    synergies: Array<Record<string, string | number | string[]>>;
    formula: {
      d_avg: number;
      weakest_district_score: number;
      n_crit: number;
      score: number;
      expression: string;
    };
  };
  improvements: Array<{ district: string; score_delta: number; indicators: Array<{ indicator: string; delta: number }> }>;
  weak_spots: Array<{ district: string; indicator: string; value: number; label: string }>;
};

export type ConfigResponse = {
  dataset_version: string;
  budget: number;
  horizon_quarters: number;
  critical_threshold: number;
  indicators: Record<string, IndicatorMeta>;
  direction_weights: Record<Direction, number>;
  districts: District[];
  measures: Measure[];
  synergies: Array<Record<string, unknown>>;
  incompatibilities: Array<{ measures: [string, string]; scope: "global" | "same_district"; reason: string }>;
  baseline: ScenarioResult;
};

export type SimulateResponse = {
  id: number;
  valid: true;
  spent_budget: number;
  remaining_budget: number;
  result: ScenarioResult;
  analysis_url: string;
};

export type AnalysisResponse = {
  ai_mode: "fallback" | "llm";
  summary: string;
  trade_off: string;
  confidence?: string;
  recommendations: Array<{
    replace: Decision;
    with: Decision;
    score: number;
    delta: number;
    message: string;
  }>;
};

export type LeaderboardItem = {
  id: number;
  team_name: string;
  score: number;
  spent_budget: number;
  weakest_district: string;
  created_at: string;
};
