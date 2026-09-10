import { prisma } from "@/lib/prisma";
import { PacmanBackground } from "./components/PacmanBackground";
import { GalaxianBackground } from "./components/GalaxianBackground";
import { AnimatedLogoLockup } from "./components/AnimatedLogoLockup";
import { BracketDemo } from "./components/BracketDemo";
import { HowItWorks } from "./components/HowItWorks";
import { GamesGrid } from "./components/GamesGrid";
import { RankingPreview } from "./components/RankingPreview";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { JoystickLogo } from "./components/JoystickLogo";
import { NavAuthCTA } from "./components/NavAuthCTA";
import { FriendsModePromo } from "./components/FriendsModePromo";
import { StaggerIn } from "./components/StaggerIn";
import { PathDoors } from "./components/PathDoors";
import { ScoreboardStrip } from "./components/ScoreboardStrip";
import { LiveTournamentTicker } from "./components/LiveTournamentTicker";
import Link from "next/link";

export const revalidate = 60;

export default async function LandingPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [upcomingTournaments, games, activePrizePool, playersCount, tournamentsThisMonth] =
    await Promise.all([
      prisma.tournament.findMany({
        where: {
          status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS"] },
          visibility: "PUBLIC", // los privados solo se encuentran con su código, no se muestran acá
        },
        include: { game: true, _count: { select: { registrations: true } } },
        orderBy: { startsAt: "asc" },
        take: 6,
      }),
      prisma.game.findMany({ orderBy: { name: "asc" }, take: 8 }),
      // "Premios activos" del marcador — suma de los torneos públicos en
      // juego ahora mismo, no plata que cobra Torneame (esa nunca pasa por
      // acá, ver Payment en el schema).
      prisma.tournament.aggregate({
        _sum: { prizePoolBase: true },
        where: { visibility: "PUBLIC", status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS"] } },
      }),
      // Jugadores "compitiendo" = con al menos una inscripción real, no
      // el total de cuentas creadas (ese número infla sin decir nada).
      prisma.playerProfile.count({ where: { registrations: { some: {} } } }),
      prisma.tournament.count({
        where: {
          visibility: "PUBLIC",
          status: { not: "DRAFT" },
          startsAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
    ]);

  return (
    <main className="relative min-h-screen">
      <PacmanBackground />

      <nav className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <JoystickLogo size={28} className="text-white" />
          <span style={{ fontFamily: "var(--font-heading)" }} className="text-lg font-medium">
            Torneame
          </span>
        </Link>
        <div className="hidden gap-6 text-sm text-secondary sm:flex">
          <Link href="/torneos">Torneos</Link>
          <Link href="/ranking">Ranking</Link>
          <Link href="/organizadores">Organizadores</Link>
        </div>
        <NavAuthCTA />
      </nav>

      {/* Hero — mismo logo animado y fondo de naves que el login, para que
          el primer momento de marca sea consistente en toda la app. El
          fondo va en un wrapper propio a todo el ancho (no metido adentro
          del max-w-2xl del contenido) para que las naves se vean a tamaño
          completo, no recortadas al ancho del texto. El fósforo/scanline
          de fondo es la atmósfera "marcador CRT" de la dirección aprobada:
          puertas 1P/2P + scoreboard en vivo (design-shotgun, variante E). */}
      <section className="relative overflow-hidden py-10 text-center sm:py-16">
        <GalaxianBackground className="opacity-90" />
        <div className="scanlines-overlay" />

        <StaggerIn className="relative mx-auto max-w-2xl px-4" staggerMs={100}>
          <AnimatedLogoLockup size={48} titleAs="p" />

          <span className="mt-6 inline-block rounded-full bg-[var(--bg-danger)] px-3 py-1 text-xs text-[var(--text-danger)]">
            {upcomingTournaments.filter((t) => t.status === "IN_PROGRESS").length} torneos en vivo ahora
          </span>
          <h1 className="mt-4 text-3xl font-medium leading-tight sm:text-5xl">
            Tu torneo, sin el quilombo
          </h1>
          <p className="mt-3 text-base text-secondary sm:text-lg">
            Armá el bracket, cobrá la inscripción y transmití resultados en vivo.
            Sin WhatsApp, sin planillas.
          </p>
        </StaggerIn>

        {/* Puertas 1P/2P — reemplazan a los dos botones parejos de antes.
            Fuera del max-w-2xl del texto porque necesitan más ancho para
            leerse como dos mitades, no dos botones chicos centrados. */}
        <div className="relative mt-8 px-4">
          <PathDoors playersCount={playersCount} tournamentsThisMonth={tournamentsThisMonth} />
        </div>
      </section>

      <ScoreboardStrip
        activePrizePool={Number(activePrizePool._sum.prizePoolBase ?? 0)}
        playersCount={playersCount}
        tournamentsThisMonth={tournamentsThisMonth}
      />

      <LiveTournamentTicker
        tournaments={upcomingTournaments.map((t) => ({
          id: t.id,
          name: t.name,
          gameName: t.game.name,
          status: t.status,
        }))}
      />

      {upcomingTournaments.length > 0 && (
        <div className="mx-auto max-w-4xl px-4 py-6 text-center">
          <Link href="/torneos" className="text-sm text-accent">
            Ver todos los torneos →
          </Link>
        </div>
      )}

      {/* Demo animada — el valor del producto sin necesidad de crear cuenta */}
      <section className="mx-auto max-w-xs px-4 py-10">
        <BracketDemo />
      </section>

      <FriendsModePromo />

      <HowItWorks />
      <GamesGrid games={games} />
      <RankingPreview />
      <Testimonials testimonials={[]} />
      <FAQ />
      <Footer />
    </main>
  );
}
