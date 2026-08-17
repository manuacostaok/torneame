import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function MyTicketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?redirect=/torneos/${slug}/mi-entrada`);

  const player = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const registration = await prisma.registration.findUnique({
    where: { tournamentId_playerId: { tournamentId: slug, playerId: player.id } },
    include: { tournament: true },
  });
  if (!registration) notFound();

  const checkInUrl = `${process.env.APP_URL}/organizador/checkin/${registration.id}`;
  // Servicio externo de generación de QR — evita mantener una librería
  // propia solo para esto. Si en algún momento preferimos no depender de
  // un tercero para algo tan central como el check-in, se reemplaza acá
  // por una librería (ej. `qrcode`) sin tocar el resto del flujo.
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    checkInUrl
  )}`;

  return (
    <main className="mx-auto max-w-sm px-4 py-10 text-center">
      <p className="text-sm text-secondary">{registration.tournament.name}</p>
      <h1 className="mt-1 text-xl font-medium">Tu entrada</h1>
      <p className="mt-1 text-sm text-secondary">
        Mostrá este QR en la entrada del torneo para que te hagan el check-in.
      </p>

      <div className="mx-auto mt-6 w-fit rounded-xl bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrImageUrl} alt="QR de check-in" width={220} height={220} />
      </div>

      {registration.checkedInAt && (
        <p className="mt-4 text-sm text-[var(--text-success)]">Ya hiciste check-in ✓</p>
      )}
    </main>
  );
}
