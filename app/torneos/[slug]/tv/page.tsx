import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BracketStructure } from "@/lib/brackets/types";

export const revalidate = 10; // el venue necesita que esto se sienta "en vivo"

export default async function TvBracketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id: slug },
    include: { bracket: true, game: true },
  });

  if (!tournament?.bracket) notFound();

  const structure = tournament.bracket.structureJson as unknown as BracketStructure;
  const rounds = Array.from(new Set(structure.matches.map((m) => m.round))).sort(
    (a, b) => a - b
  );

  return (
    // Layout propio, sin nav ni footer del sitio — esto se abre en la TV
    // del venue, no es una página que alguien navega desde el menú
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "3rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "1.5rem", color: "#8a93a6" }}>{tournament.game.name}</p>
        <h1 style={{ fontSize: "3rem", fontWeight: 500, margin: "0.25rem 0" }}>
          {tournament.name}
        </h1>
      </div>

      <div style={{ display: "flex", gap: "3rem", overflowX: "auto" }}>
        {rounds.map((round) => (
          <div
            key={round}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              justifyContent: "center",
              minWidth: "280px",
            }}
          >
            <p style={{ fontSize: "1.1rem", color: "#8a93a6", textAlign: "center" }}>
              Ronda {round}
            </p>
            {structure.matches
              .filter((m) => m.round === round)
              .map((match) => (
                <div
                  key={match.id}
                  style={{
                    padding: "1rem 1.5rem",
                    borderRadius: "12px",
                    fontSize: "1.4rem",
                    background: match.winnerId ? "#0d3b2e" : "#151a23",
                    border:
                      match.playerAId && match.playerBId && !match.winnerId
                        ? "2px solid #7c5cfc"
                        : "none",
                  }}
                >
                  {match.playerAId ?? "—"} vs {match.playerBId ?? "—"}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
