import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/perfil");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { playerProfile: true, organizerProfile: true },
  });
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-medium">Mi perfil</h1>
      <p className="mt-1 text-sm text-secondary">{user.email}</p>

      <div className="mt-6">
        <ProfileForm name={user.name} avatarUrl={user.avatarUrl ?? ""} />
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {user.playerProfile && (
          <Link
            href="/jugador/dashboard"
            className="rounded-md bg-surface-1 p-3 text-sm hover:bg-surface-2"
          >
            Panel de jugador — @{user.playerProfile.gamertag}
          </Link>
        )}
        {user.organizerProfile ? (
          <Link
            href="/organizador/dashboard"
            className="rounded-md bg-surface-1 p-3 text-sm hover:bg-surface-2"
          >
            Panel de organizador — {user.organizerProfile.orgName}
          </Link>
        ) : (
          <Link
            href="/organizador/perfil/nuevo"
            className="rounded-md border border-strong p-3 text-center text-sm text-accent"
          >
            + Crear torneo (convertite en organizador)
          </Link>
        )}
      </div>
    </main>
  );
}
