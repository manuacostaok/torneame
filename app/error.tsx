"use client";

import Link from "next/link";

// Error boundary de la app: si algo falla al renderizar una página, en vez
// de la pantalla de error cruda de Next.js se muestra esto, con opción de
// reintentar (reset vuelve a renderizar solo el segmento que falló).
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="text-3xl text-[var(--text-danger)] sm:text-4xl"
        style={{ fontFamily: "var(--font-pixel)", textShadow: "0 3px 0 rgba(0,0,0,0.6)" }}
      >
        ¡Ups!
      </p>
      <h1 className="mt-6 text-xl font-medium sm:text-2xl">Algo salió mal de nuestro lado</h1>
      <p className="mt-2 max-w-sm text-sm text-secondary">
        No pudimos cargar esta pantalla. Probá de nuevo; si sigue pasando, avisanos.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-white"
        >
          Reintentar
        </button>
        <Link href="/contacto" className="rounded-md border border-strong px-6 py-3 text-sm">
          Contactanos
        </Link>
      </div>
    </main>
  );
}
