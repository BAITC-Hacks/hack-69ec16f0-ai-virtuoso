import type { AnalysisResponse, ConfigResponse, Decision, LeaderboardItem, SimulateResponse, ValidationResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = await response.json() as unknown;
  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }
  return payload as T;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

export function getConfig() {
  return request<ConfigResponse>("/config/");
}

export function getLeaderboard() {
  return request<LeaderboardItem[]>("/leaderboard/");
}

export function validateScenario(decisions: Decision[], teamName: string) {
  return request<ValidationResponse>("/scenarios/validate/", {
    method: "POST",
    body: JSON.stringify({ team_name: teamName, decisions })
  });
}

export function simulateScenario(decisions: Decision[], teamName: string) {
  return request<SimulateResponse>("/scenarios/simulate/", {
    method: "POST",
    body: JSON.stringify({ team_name: teamName, decisions })
  });
}

export function getAnalysis(url: string) {
  const path = url.replace("/api/v1", "");
  return request<AnalysisResponse>(path, { method: "POST", body: JSON.stringify({}) });
}
