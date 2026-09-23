import { TopNav } from "@/components/layout/TopNav";

export default function MethodologyPage() {
  return (
    <main className="min-h-screen">
      <TopNav />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm uppercase tracking-[0.18em] text-civic">Transparency</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Методика расчёта</h1>
        <div className="mt-8 grid gap-4">
          {[
            ["Исходные показатели", "Пять районов Астаны имеют population share и десять индикаторов T1...C2 на шкале 0–100."],
            ["Лаги", "Обычный эффект меры масштабируется по формуле full_effect × (8 − lag) / 8."],
            ["District score", "Районный score считается как взвешенная сумма десяти индикаторов. Сумма весов равна 1."],
            ["City average", "D_avg — population weighted average по пяти районам."],
            ["Weakest district", "D_min — минимальный district score после всех эффектов и clipping."],
            ["Critical penalty", "N_crit — количество district × indicator со значением строго меньше 40. Ровно 40 не считается критическим."],
            ["Final Score", "Score = 0.7 × D_avg + 0.3 × D_min − N_crit."],
            ["Синергии", "M1+M2, M10+M12 и M5+M6 применяются после обычных эффектов и не масштабируются лагом."],
            ["Несовместимости", "M1+M3 запрещены глобально. M4+M7 и M5+M13 запрещены в одном районе."]
          ].map(([title, text]) => (
            <article key={title} className="rounded-lg border border-line bg-panel/85 p-5">
              <h2 className="text-xl font-semibold text-ink">{title}</h2>
              <p className="mt-2 leading-7 text-muted">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-civic/40 bg-civic/10 p-5 font-mono text-civic">
          Score = 0.7 * D_avg + 0.3 * D_min - N_crit
        </div>
      </section>
    </main>
  );
}
