import { prisma } from "@/lib/prisma";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { BracketDemo } from "./components/BracketDemo";
import { HowItWorks } from "./components/HowItWorks";
import { GamesGrid } from "./components/GamesGrid";
import { RankingPreview } from "./components/RankingPreview";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import Link from "next/link";

export const revalidate = 60;

export default async function LandingPage() {
  const [upcomingTournaments, games] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS"] } },
      include: { game: true, _count: { select: { registrations: true } } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    prisma.game.findMany({ orderBy: { name: "asc" }, take: 8 }),
  ]);

  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />

      <nav className="flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="text-lg font-medium">Torneame</span>
        <div className="hidden gap-6 text-sm text-secondary sm:flex">
          <Link href="/torneos">Torneos</Link>
          <Link href="/ranking">Ranking</Link>
          <Link href="/organizadores">Organizadores</Link>
        </div>
        <Link href="/registro" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
          Crear cuenta
        </Link>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-4 py-10 text-center sm:py-16">
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
          {upcomingTournaments.filter((t) => t.status === "IN_PROGRESS").length} torneos en vivo ahora
        </span>
        <h1 className="mt-4 text-3xl font-medium leading-tight sm:text-5xl">
          Tu torneo, sin el quilombo
        </h1>
        <p className="mt-3 text-base text-secondary sm:text-lg">
          Armá el bracket, cobrá la inscripción y transmití resultados en vivo.
          Sin WhatsApp, sin planillas.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/registro?rol=jugador" className="rounded-md bg-primary px-6 py-3 text-white">
            Soy jugador
          </Link>
          <Link
            href="/registro?rol=organizador"
            className="rounded-md border border-strong px-6 py-3"
          >
            Quiero organizar
          </Link>
        </div>
        <Link href="/amigos/nuevo" className="mt-3 inline-block text-sm text-accent">
          ¿Es solo entre amigos? Sorteá equipos gratis, sin cuenta →
        </Link>
      </section>

      {/* Demo animada — el valor del producto sin necesidad de crear cuenta */}
      <section className="mx-auto max-w-xs px-4 pb-10">
        <BracketDemo />
      </section>

      {/* Próximos torneos */}
      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-4 pb-14 sm:grid-cols-3">
        {upcomingTournaments.map((t) => (
          <Link
            href={`/torneos/${t.id}`}
            key={t.id}
            className="rounded-xl bg-surface-1 p-4 transition hover:bg-surface-2"
          >
            <div className="flex items-start justify-between">
              <span className="text-sm text-secondary">{t.game.name}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs ${
                  t.status === "IN_PROGRESS"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {t.status === "IN_PROGRESS" ? "EN VIVO" : "ABIERTO"}
              </span>
            </div>
            <p className="mt-2 font-medium">{t.name}</p>
            <p className="mt-1 text-sm text-secondary">
              {t._count.registrations}/{t.maxPlayers} inscriptos
            </p>
            <p className="mt-2 font-medium text-amber-600">
              ${Number(t.prizePoolBase).toLocaleString("es-AR")} en premios
            </p>
          </Link>
        ))}
        {upcomingTournaments.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted">
            Todavía no hay torneos publicados — sé el primero en organizar uno.
          </p>
        )}
      </section>

      <HowItWorks />
      <GamesGrid games={games} />
      <RankingPreview />
      <Testimonials testimonials={[]} />
      <FAQ />
      <Footer />
    </main>
  );
}
