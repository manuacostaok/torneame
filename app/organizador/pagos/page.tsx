import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PaymentReviewCard } from "./PaymentReviewCard";

export default async function OrganizerPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/organizador/pagos");
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") redirect("/");

  const organizer = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!organizer) redirect("/organizador/perfil/nuevo");

  const registrations = await prisma.registration.findMany({
    where: {
      tournament: { organizerId: organizer.id },
      payment: { status: "PENDING" },
    },
    include: {
      player: { include: { user: true } },
      tournament: true,
      payment: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <Link href="/organizador/dashboard" className="text-sm text-secondary">
        ← Volver a mi panel
      </Link>

      <h1 className="mt-3 text-xl font-medium">Pagos por revisar</h1>
      <p className="mt-1 text-sm text-secondary">
        Fijate el comprobante contra tu cuenta y confirmá si pasa o no.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {registrations.map((r) => (
          <PaymentReviewCard
            key={r.id}
            registrationId={r.id}
            playerName={r.player.user.name}
            gamertag={r.player.gamertag}
            tournamentName={r.tournament.name}
            amount={Number(r.payment!.amount)}
            receiptImageUrl={r.payment!.receiptImageUrl}
          />
        ))}
        {registrations.length === 0 && (
          <p className="text-sm text-muted">No tenés pagos pendientes de revisar.</p>
        )}
      </div>
    </main>
  );
}
