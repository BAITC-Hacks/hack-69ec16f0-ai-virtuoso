import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-between px-5 py-8 sm:px-8">
        <nav className="flex items-center justify-between text-sm text-muted">
          <span className="font-semibold tracking-wide text-ink">AKIM OS</span>
          <div className="flex gap-4">
            <Link className="hover:text-ink" href="/methodology">Методика</Link>
            <Link className="hover:text-ink" href="/leaderboard">Leaderboard</Link>
          </div>
        </nav>
        <div className="py-16">
          <h1 className="max-w-3xl text-6xl font-semibold leading-[1.02] text-ink sm:text-7xl lg:text-8xl">AKIM OS</h1>
          <p className="mt-4 text-2xl text-ink">Аким на 5 часов</p>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted">100 единиц бюджета. 5 решений. Один результат.</p>
          <Link
            className="focus-ring mt-10 inline-flex items-center gap-3 rounded-md bg-civic px-6 py-4 font-semibold text-surface transition hover:bg-ink"
            href="/simulator"
          >
            Начать
            <ArrowRight size={20} />
          </Link>
        </div>
        <div />
      </section>
    </main>
  );
}
