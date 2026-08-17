import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { FollowButton } from "./FollowButton";
import { BuyProductButton } from "./BuyProductButton";
import Link from "next/link";

export default async function OrganizerProfilePage({ params }: { params: { slug: string } }) {
  const organizer = await prisma.organizerProfile.findUnique({
    where: { slug: params.slug },
    include: {
      tournaments: {
        where: { status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS", "FINISHED"] } },
        include: { game: true, _count: { select: { registrations: true } } },
        orderBy: { startsAt: "desc" },
        take: 12,
      },
      _count: { select: { followers: true } },
      products: { where: { active: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!organizer) notFound();

  const session = await auth();
  const isFollowing = session?.user
    ? !!(await prisma.follow.findUnique({
        where: {
          followerId_organizerId: { followerId: session.user.id, organizerId: organizer.id },
        },
      }))
    : false;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-surface-1 text-lg font-medium">
            {organizer.orgName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-medium">{organizer.orgName}</h1>
            <p className="text-sm text-secondary">{organizer._count.followers} seguidores</p>
          </div>
        </div>
        <FollowButton
          organizerId={organizer.id}
          initiallyFollowing={isFollowing}
          isLoggedIn={!!session?.user}
        />
      </div>

      {organizer.bio && <p className="mt-4 text-sm text-secondary">{organizer.bio}</p>}

      <div className="mt-8">
        <p className="mb-3 text-sm text-secondary">Torneos</p>
        <div className="flex flex-col gap-2">
          {organizer.tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/torneos/${t.id}`}
              className="flex items-center justify-between rounded-md bg-surface-1 p-3 hover:bg-surface-2"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted">{t.game.name}</p>
              </div>
              <span className="text-xs text-secondary">
                {t._count.registrations}/{t.maxPlayers}
              </span>
            </Link>
          ))}
          {organizer.tournaments.length === 0 && (
            <p className="text-sm text-muted">Todavía no publicó torneos.</p>
          )}
        </div>
      </div>

      {organizer.products.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm text-secondary">Merchandising</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {organizer.products.map((p) => (
              <div key={p.id} className="rounded-lg bg-surface-1 p-3">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="mb-2 aspect-square w-full rounded-md object-cover" />
                )}
                <p className="text-sm font-medium">{p.name}</p>
                <p className="mb-2 text-sm text-[var(--text-warning)]">
                  ${Number(p.price).toLocaleString("es-AR")}
                </p>
                <BuyProductButton productId={p.id} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
