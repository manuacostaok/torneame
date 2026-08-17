import type { MetadataRoute } from "next";

// Next.js sirve esto automáticamente en /manifest.webmanifest — es lo que
// el navegador lee para decidir si puede ofrecer "instalar como app" y
// con qué ícono/nombre/color aparece en la pantalla de inicio.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Torneame",
    short_name: "Torneame",
    description: "Tu torneo, sin el quilombo.",
    start_url: "/",
    display: "standalone", // sin la barra de direcciones del navegador — se siente app, no página
    background_color: "#0b0e14",
    theme_color: "#0b0e14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}
