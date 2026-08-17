interface Game {
  id: string;
  name: string;
  platform: string | null;
}

export function GamesGrid({ games }: { games: Game[] }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium sm:text-2xl">Juegos disponibles</h2>
        <span className="text-xs text-muted">Cualquier juego que quieras organizar</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {games.map((g) => (
          <div key={g.id} className="rounded-lg bg-surface-1 p-4 text-center">
            <p className="font-medium">{g.name}</p>
            {g.platform && <p className="mt-1 text-xs text-muted">{g.platform}</p>}
          </div>
        ))}
        <div className="flex items-center justify-center rounded-lg border border-dashed border-strong p-4 text-center text-sm text-secondary">
          + el tuyo
        </div>
      </div>
    </section>
  );
}
