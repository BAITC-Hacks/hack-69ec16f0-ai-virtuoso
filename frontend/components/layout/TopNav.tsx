import Link from "next/link";
import { BookOpen, SlidersHorizontal, Trophy } from "lucide-react";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-wide text-ink">AKIM OS</Link>
        <nav className="flex items-center gap-1 text-sm text-muted sm:gap-4">
          <Link className="focus-ring rounded-md p-2 hover:text-ink sm:p-0" href="/simulator" title="Симулятор">
            <SlidersHorizontal className="sm:hidden" size={19} />
            <span className="hidden sm:inline">Симулятор</span>
          </Link>
          <Link className="focus-ring rounded-md p-2 hover:text-ink sm:p-0" href="/methodology" title="Методика">
            <BookOpen className="sm:hidden" size={19} />
            <span className="hidden sm:inline">Методика</span>
          </Link>
          <Link className="focus-ring rounded-md p-2 hover:text-ink sm:p-0" href="/leaderboard" title="Рейтинг">
            <Trophy className="sm:hidden" size={19} />
            <span className="hidden sm:inline">Рейтинг</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
