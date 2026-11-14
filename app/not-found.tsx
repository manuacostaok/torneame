import Link from "next/link";

export const metadata = { title: "Página no encontrada" };

// Antes un link roto mostraba el 404 genérico de Next.js, fuera de la
// identidad de la app y sin salida clara. Estilo "game over" de arcade,
// con el mismo tono de la landing.
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="text-5xl text-accent sm:text-6xl"
        style={{ fontFamily: "var(--font-pixel)", textShadow: "0 3px 0 rgba(0,0,0,0.6)" }}
      >
        404
      </p>
      <h1 className="mt-6 text-xl font-medium sm:text-2xl">Esta pantalla no existe</h1>
      <p className="mt-2 max-w-sm text-sm text-secondary">
        El link que seguiste está roto o la página se movió. Volvé al inicio o mirá qué torneos
        hay abiertos.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-white">
          Volver al inicio
        </Link>
        <Link href="/torneos" className="rounded-md border border-strong px-6 py-3 text-sm">
          Ver torneos
        </Link>
      </div>
    </main>
  );
}
