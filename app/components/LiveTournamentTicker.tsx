import Link from "next/link";

interface TickerTournament {
  id: string;
  name: string;
  gameName: string;
  status: "REGISTRATION_OPEN" | "IN_PROGRESS" | string;
}

// Ticker horizontal de torneos — reemplaza a la vieja grilla de 3
// tarjetas estáticas. Con pocos torneos igual "se siente" en movimiento
// (loop corto) en vez de una lista que hay que refrescar para saber si
// cambió algo.
export function LiveTournamentTicker({ tournaments }: { tournaments: TickerTournament[] }) {
  if (tournaments.length === 0) return null;

  // Se duplica la lista para que el loop de -50% no se note el corte.
  const doubled = [...tournaments, ...tournaments];

  return (
    <div className="overflow-hidden bg-surface-1 py-5">
      <div className="ticker-track flex w-max gap-4">
        {doubled.map((t, i) => (
          <Link
            key={`${t.id}-${i}`}
            href={`/torneos/${t.id}`}
            className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-strong bg-surface-2 px-4 py-2 text-sm transition hover:bg-surface-1"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                t.status === "IN_PROGRESS" ? "bg-[var(--text-danger)]" : "bg-[var(--text-success)]"
              }`}
            />
            {t.name} · <span className="text-secondary">{t.gameName}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
