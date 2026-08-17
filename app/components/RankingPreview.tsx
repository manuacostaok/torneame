import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function RankingPreview() {
  const topPlayers = await prisma.playerProfile.findMany({
    orderBy: { eloRating: "desc" },
    take: 5,
    include: { user: { select: { name: true, avatarUrl: true } } },
  });

  if (topPlayers.length === 0) return null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium sm:text-2xl">Ranking</h2>
        <Link href="/ranking" className="text-sm text-accent">
          Ver todo
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {topPlayers.map((p, i) => (
          <Link
            href={`/jugadores/${p.id}`}
            key={p.id}
            className="flex items-center justify-between rounded-md bg-surface-1 p-3 transition hover:bg-surface-2"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 text-sm text-muted">{i + 1}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                {p.user.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{p.user.name}</p>
                <p className="text-xs text-muted">{p.gamertag}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-accent">{p.eloRating}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
