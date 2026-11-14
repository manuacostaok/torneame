import Link from "next/link";
import { CountUp } from "./CountUp";

// Reemplaza a los dos botones de CTA parejos del hero viejo — en vez de
// "¿cuál toco?", esto es una pantalla de selección estilo arcade (1P/2P).
// Cada puerta lleva su propio dato en vivo, como si el marcador ya
// estuviera corriendo adentro de la puerta que vas a elegir.
export function PathDoors({
  playersCount,
  tournamentsThisMonth,
}: {
  playersCount: number;
  tournamentsThisMonth: number;
}) {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-[3px] overflow-hidden rounded-2xl sm:grid-cols-2">
      <Link
        href="/registro?rol=jugador"
        className="group relative px-8 py-10 transition hover:scale-[1.01]"
        style={{ background: "linear-gradient(160deg, #2a1f5c, #17102e)" }}
      >
        <span
          className="block text-xl text-[var(--text-accent)]"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          1P
        </span>
        <p className="mt-3 text-2xl font-medium">Soy jugador</p>
        <p className="mt-2 max-w-xs text-sm text-secondary">
          Buscá torneos abiertos, anotate en segundos y seguí tu bracket en vivo.
        </p>
        <div
          className="mt-6 flex items-center gap-2 border-t border-dashed border-white/15 pt-3 text-sm text-[var(--text-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-success)]" />
          <CountUp value={playersCount} /> jugadores compitiendo
        </div>
      </Link>

      <Link
        href="/registro?rol=organizador"
        className="group relative px-8 py-10 transition hover:scale-[1.01]"
        style={{ background: "linear-gradient(200deg, #0a3d38, #0a1a1c)" }}
      >
        <span
          className="block text-xl text-[#00d9c0]"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          2P
        </span>
        <p className="mt-3 text-2xl font-medium">Quiero organizar</p>
        <p className="mt-2 max-w-xs text-sm text-secondary">
          Armá el bracket, cobrá inscripciones y transmití resultados sin planillas.
        </p>
        <div
          className="mt-6 flex items-center gap-2 border-t border-dashed border-white/15 pt-3 text-sm text-[#00d9c0]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-success)]" />
          <CountUp value={tournamentsThisMonth} /> torneos este mes
        </div>
      </Link>
    </div>
  );
}
