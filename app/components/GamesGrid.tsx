import Link from "next/link";

interface Game {
  id: string;
  name: string;
  platform: string | null;
}

// "+ el tuyo" no es una promesa vacía: el wizard de creación de torneo
// (app/organizador/torneos/nuevo/NewTournamentWizard.tsx) tiene la opción
// "Mi juego no está en la lista" y lo carga en el momento — el FAQ del
// sitio ya dice "no hay una lista cerrada", esto lo hace visible acá
// también, no solo en la letra chica.
export function GamesGrid({ games }: { games: Game[] }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <h2 className="text-xl font-medium sm:text-2xl">Juegos disponibles</h2>
      <p className="mt-1 text-sm text-secondary">
        Esta es solo la lista de lo que ya se jugó en la plataforma — no hace falta que tu juego
        esté acá. Al crear el torneo podés cargarlo vos si no lo encontrás.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {games.map((g) => (
          <div key={g.id} className="rounded-lg bg-surface-1 p-4 text-center">
            <p className="font-medium">{g.name}</p>
            {g.platform && <p className="mt-1 text-xs text-muted">{g.platform}</p>}
          </div>
        ))}
        <Link
          href="/registro?rol=organizador"
          className="flex flex-col items-center justify-center gap-1 rounded-lg border border-primary/40 bg-primary/10 p-4 text-center text-sm text-accent transition hover:bg-primary/20"
        >
          <span className="font-medium">+ el tuyo</span>
          <span className="text-xs text-secondary">Cargalo al crear tu torneo</span>
        </Link>
      </div>
    </section>
  );
}
