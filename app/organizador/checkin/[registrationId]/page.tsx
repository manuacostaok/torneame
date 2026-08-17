import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CheckInConfirmButton } from "./CheckInConfirmButton";
import { prisma } from "@/lib/prisma";

export default async function CheckInPage({
  params,
}: {
  params: { registrationId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/login?redirect=/organizador/checkin/${params.registrationId}`);

  const registration = await prisma.registration.findUnique({
    where: { id: params.registrationId },
    include: { player: { include: { user: true } }, tournament: true },
  });

  if (!registration) {
    return <main className="mx-auto max-w-sm px-4 py-10 text-center">Inscripción no encontrada.</main>;
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10 text-center">
      <p className="text-sm text-secondary">{registration.tournament.name}</p>
      <h1 className="mt-1 text-xl font-medium">{registration.player.user.name}</h1>
      {registration.checkedInAt ? (
        <p className="mt-4 text-sm text-[var(--text-success)]">Ya hizo check-in.</p>
      ) : (
        <CheckInConfirmButton registrationId={registration.id} />
      )}
    </main>
  );
}
