import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.APP_URL ?? "https://torneame.vercel.app";

// Se regenera por hora: alcanza para que los torneos nuevos aparezcan en
// el sitemap sin pegarle a la base en cada pedido del crawler.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/torneos", "/ranking", "/organizadores", "/amigos/nuevo", "/sobre-nosotros", "/contacto", "/terminos", "/privacidad"].map(
    (path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })
  );

  // Solo torneos públicos: los privados se encuentran por código, no
  // deben quedar indexados.
  const tournaments = await prisma.tournament.findMany({
    where: {
      visibility: "PUBLIC",
      status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS", "FINISHED"] },
    },
    select: { id: true, createdAt: true },
    take: 500,
  });

  return [
    ...staticRoutes,
    ...tournaments.map((t) => ({ url: `${SITE_URL}/torneos/${t.id}`, lastModified: t.createdAt })),
  ];
}
