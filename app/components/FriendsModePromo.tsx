import Link from "next/link";
import { PowerMushroomIcon, VersusIcon } from "./icons/GamerIcons";

// Antes esto era un link de texto chico debajo de los botones del hero —
// muy fácil de no ver. El modo amigos es un producto completo (sorteo de
// equipos + bracket, sin cuenta ni inscripción paga) y se merece su propia
// sección, con el mismo peso visual que "Cómo funciona" o la grilla de
// torneos de abajo.
export function FriendsModePromo() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-14">
      <div className="relative overflow-hidden rounded-2xl border border-strong bg-surface-1 p-6 sm:p-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex flex-shrink-0 items-center gap-3">
            <PowerMushroomIcon className="h-14 w-14 text-[var(--text-warning)]" />
            <VersusIcon className="h-14 w-14 text-accent" />
          </div>
          <div className="flex-1">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-accent">
              Modo Amigos
            </span>
            <h2 className="mt-2 text-xl font-medium sm:text-2xl">
              ¿Es solo entre amigos? Sorteá equipos gratis
            </h2>
            <p className="mt-2 text-sm text-secondary sm:text-base">
              Cargá los nombres, elegimos el cruce, listo — sin cuenta, sin inscripción paga.
              Sirve para cualquier juego, de 1v1 a 11v11 (hasta para el picadito de la plaza).
            </p>
          </div>
          <Link
            href="/amigos/nuevo"
            className="flex-shrink-0 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white"
          >
            Armar torneo entre amigos
          </Link>
        </div>
      </div>
    </section>
  );
}
