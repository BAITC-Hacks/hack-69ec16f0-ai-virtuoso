"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { getLeaderboard } from "@/lib/api";
import { fmt } from "@/lib/format";
import type { LeaderboardItem } from "@/lib/types";

export default function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard().then(setItems).catch(() => setError("Рейтинг пока недоступен."));
  }, []);

  return (
    <main className="min-h-screen">
      <TopNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-semibold text-ink">Рейтинг</h1>
        {error && <div className="mt-6 rounded-lg border border-alert/40 bg-alert/10 p-4 text-alert">{error}</div>}
        <div className="mt-8 overflow-hidden rounded-lg border border-line bg-panel/85">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3">Команда</th>
                <th className="px-4 py-3">Результат</th>
                <th className="px-4 py-3">Бюджет</th>
                <th className="px-4 py-3">Слабый район</th>
                <th className="px-4 py-3">Время</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td className="px-4 py-6 text-muted" colSpan={5}>Пока нет сохранённых сценариев.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3 text-ink">{item.team_name || `Scenario ${item.id}`}</td>
                  <td className="px-4 py-3 font-semibold text-civic">{fmt(item.score)}</td>
                  <td className="px-4 py-3 text-muted">{item.spent_budget}</td>
                  <td className="px-4 py-3 text-muted">{item.weakest_district}</td>
                  <td className="px-4 py-3 text-muted">{new Date(item.created_at).toLocaleString("ru-RU")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
