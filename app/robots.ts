import type { MetadataRoute } from "next";

const SITE_URL = process.env.APP_URL ?? "https://torneame.vercel.app";

// Las áreas privadas (paneles, perfil, admin) no tienen nada para indexar
// y no deberían aparecer en un buscador.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/superadmin", "/perfil", "/jugador/", "/organizador/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
