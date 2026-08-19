import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 300;

export default async function OrganizersListPage() {
  const organizers = await prisma.organizerProfile.findMany({
    include: { _count: { select: { followers: true, tournaments: true } } },
    orderBy: { verified: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-medium">Organizadores</h1>
      <p className="mt-1 text-sm text-secondary">
        Todos los que arman torneos en Torneame.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {organizers.map((org) => (
          <Link
            key={org.id}
            href={`/organizadores/${org.slug}`}
            className="flex items-center gap-3 rounded-md bg-surface-1 p-3 hover:bg-surface-2"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium">
              {org.orgName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {org.orgName} {org.verified && "✓"}
              </p>
              <p className="text-xs text-muted">
                {org._count.tournaments} torneos · {org._count.followers} seguidores
              </p>
            </div>
          </Link>
        ))}
        {organizers.length === 0 && (
          <p className="text-sm text-muted">Todavía no hay organizadores.</p>
        )}
      </div>
    </main>
  );
}
