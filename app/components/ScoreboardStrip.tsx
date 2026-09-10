import { CountUp } from "./CountUp";

// Marcador estilo scoreboard de estadio: números grandes, mono tabular,
// tratados como elemento hero en vez de escondidos en un dashboard.
// Refuerza la idea de "esto no es una landing estática, está corriendo".
export function ScoreboardStrip({
  activePrizePool,
  playersCount,
  tournamentsThisMonth,
}: {
  activePrizePool: number;
  playersCount: number;
  tournamentsThisMonth: number;
}) {
  return (
    <div className="border-y border-strong bg-[#08090e] py-7">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-4 text-center">
        <div>
          <div
            className="text-2xl font-bold text-[var(--text-warning)] sm:text-4xl"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <CountUp value={activePrizePool} prefix="$" />
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">en premios activos</p>
        </div>
        <div>
          <div
            className="text-2xl font-bold text-[#00d9c0] sm:text-4xl"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <CountUp value={playersCount} />
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">jugadores compitiendo</p>
        </div>
        <div>
          <div
            className="text-2xl font-bold text-[var(--text-accent)] sm:text-4xl"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <CountUp value={tournamentsThisMonth} />
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">torneos este mes</p>
        </div>
      </div>
    </div>
  );
}
