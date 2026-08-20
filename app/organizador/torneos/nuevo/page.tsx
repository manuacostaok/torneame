import { auth, isAdmin } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewTournamentWizard } from "./NewTournamentWizard";

export default async function NewTournamentPage() {
  const session = await auth();

  // Capa de seguridad extra: aunque el server action también valida el rol,
  // no queremos ni siquiera renderizar el formulario para alguien que no
  // puede usarlo — evita filtrar la existencia de la lista de juegos, etc.
  if (!session?.user) redirect("/login?redirect=/organizador/torneos/nuevo");
  if (session.user.role !== "ORGANIZER" && !isAdmin(session.user.role)) {
    redirect("/registro?rol=organizador");
  }

  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-xl font-medium">Crear torneo</h1>
      <p className="mt-1 text-sm text-secondary">
        5 pasos, como armarías el flyer — pero esto queda listo para cobrar e
        inscribir gente solo.
      </p>
      <NewTournamentWizard games={games} />
    </main>
  );
}
