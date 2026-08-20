import { prisma } from "@/lib/prisma";
import { AnimatedBackground } from "./components/AnimatedBackground";
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
import Link from "next/link";

export const revalidate = 60;

export default async function LandingPage() {
  const [upcomingTournaments, games] = await Promise.all([
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
  ]);

  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />

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
        <Link href="/registro" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
          Crear cuenta
        </Link>
      </nav>

      {/* Hero — mismo logo animado y fondo de naves que el login, para que
          el primer momento de marca sea consistente en toda la app. El
          fondo va en un wrapper propio a todo el ancho (no metido adentro
          del max-w-2xl del contenido) para que las naves se vean a tamaño
          completo, no recortadas al ancho del texto. */}
      <section className="relative overflow-hidden py-10 text-center sm:py-16">
        <GalaxianBackground className="opacity-90" />

        <div className="relative mx-auto max-w-2xl px-4">
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
        </div>
      </section>

      {/* Demo animada — el valor del producto sin necesidad de crear cuenta */}
      <section className="mx-auto max-w-xs px-4 pb-10">
        <BracketDemo />
      </section>

      {/* Torneos en la plataforma — de cualquier organizador, no solo
          demo. Título grande a propósito: es la prueba social de que la
          plataforma tiene actividad real, el primer lugar donde alguien
          nuevo entiende que esto no es una landing vacía. */}
      <section className="mx-auto max-w-4xl px-4 pb-4 text-center">
        <h2 className="text-2xl font-medium sm:text-3xl">Mirá los torneos que se están armando</h2>
        <p className="mt-2 text-sm text-secondary sm:text-base">
          De cualquier organizador de la plataforma — anotate en el que quieras.
        </p>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-4 pb-8 sm:grid-cols-3">
        {upcomingTournaments.map((t) => (
          <Link
            href={`/torneos/${t.id}`}
            key={t.id}
            className="overflow-hidden rounded-xl bg-surface-1 transition hover:bg-surface-2"
          >
            {t.bannerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.bannerImageUrl}
                alt={t.name}
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-surface-2 text-sm text-muted">
                {t.game.name}
              </div>
            )}
            <div className="p-4">
            <div className="flex items-start justify-between">
              <span className="text-sm text-secondary">{t.game.name}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs ${
                  t.status === "IN_PROGRESS"
                    ? "bg-[var(--bg-danger)] text-[var(--text-danger)]"
                    : "bg-[var(--bg-success)] text-[var(--text-success)]"
                }`}
              >
                {t.status === "IN_PROGRESS" ? "EN VIVO" : "ABIERTO"}
              </span>
            </div>
            <p className="mt-2 font-medium">{t.name}</p>
            <p className="mt-1 text-sm text-secondary">
              {t._count.registrations}/{t.maxPlayers} inscriptos
            </p>
            <p className="mt-2 font-medium text-[var(--text-warning)]">
              ${Number(t.prizePoolBase).toLocaleString("es-AR")} en premios
            </p>
            </div>
          </Link>
        ))}
        {upcomingTournaments.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted">
            Todavía no hay torneos publicados — sé el primero en organizar uno.
          </p>
        )}
      </section>

      {upcomingTournaments.length > 0 && (
        <div className="mx-auto max-w-4xl px-4 pb-14 text-center">
          <Link href="/torneos" className="text-sm text-accent">
            Ver todos los torneos →
          </Link>
        </div>
      )}

      <HowItWorks />
      <GamesGrid games={games} />
      <RankingPreview />
      <Testimonials testimonials={[]} />
      <FAQ />
      <Footer />
    </main>
  );
}
