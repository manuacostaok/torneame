import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function NetworkPage({ params }: { params: { slug: string } }) {
  const network = await prisma.network.findUnique({
    where: { slug: params.slug },
    include: {
      organizers: {
        include: { _count: { select: { followers: true, tournaments: true } } },
      },
    },
  });

  if (!network) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-medium">{network.name}</h1>
      {network.bio && <p className="mt-2 text-sm text-secondary">{network.bio}</p>}

      <p className="mt-6 mb-3 text-sm text-secondary">
        Organizadores en {network.organizers.length} ciudad
        {network.organizers.length === 1 ? "" : "es"}
      </p>
      <div className="flex flex-col gap-2">
        {network.organizers.map((org) => (
          <Link
            key={org.id}
            href={`/organizadores/${org.slug}`}
            className="flex items-center justify-between rounded-md bg-surface-1 p-3 hover:bg-surface-2"
          >
            <div>
              <p className="font-medium">{org.orgName}</p>
              <p className="text-xs text-muted">
                {org._count.tournaments} torneos · {org._count.followers} seguidores
              </p>
            </div>
          </Link>
        ))}
        {network.organizers.length === 0 && (
          <p className="text-sm text-muted">Todavía no hay organizadores en esta red.</p>
        )}
      </div>
    </main>
  );
}
