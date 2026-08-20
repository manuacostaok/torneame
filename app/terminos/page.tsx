export const metadata = { title: "Términos y condiciones — Torneame" };

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-2xl font-medium">Términos y condiciones</h1>
      <p className="mt-2 text-xs text-muted">
        Última actualización: {new Date().toLocaleDateString("es-AR")}
      </p>

      <div className="mt-6 flex flex-col gap-5 text-sm text-secondary sm:text-base">
        <p className="rounded-md bg-surface-1 p-3 text-xs text-muted">
          Este es un borrador simple, en criollo — no reemplaza la revisión de un abogado.
          Antes de publicar con inscripciones pagas de verdad, conviene que alguien con
          conocimiento legal lo revise.
        </p>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Qué es Torneame</h2>
          <p className="mt-1">
            Torneame es una plataforma para organizar y jugar torneos, presenciales u online, de
            cualquier videojuego. Conectamos organizadores y jugadores: armamos el bracket, el
            ranking y la comunicación del torneo, pero no somos parte de la relación entre
            organizador y jugador.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Inscripciones y pagos</h2>
          <p className="mt-1">
            Cuando un torneo tiene costo de inscripción, la transferencia va directo del jugador
            al organizador (a su alias o CBU). Torneame no procesa ni retiene ese dinero, no cobra
            comisión sobre inscripciones, y no es responsable por disputas de pago entre
            organizador y jugador — el organizador es quien confirma o rechaza cada inscripción
            después de revisar el comprobante.
          </p>
          <p className="mt-1">
            El plan PRO (funciones extra para organizadores) sí se cobra directo a través de
            Mercado Pago, como una suscripción mensual.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Tu cuenta</h2>
          <p className="mt-1">
            Sos responsable de la información que cargás y de mantener tu contraseña segura. Nos
            reservamos el derecho de suspender una cuenta que use la plataforma para estafar,
            acosar o violar la ley.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Contenido</h2>
          <p className="mt-1">
            Sos responsable de las imágenes, comentarios y demás contenido que subís (flyers de
            torneo, comprobantes, comentarios). No subas nada que no tengas derecho a usar.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Cambios</h2>
          <p className="mt-1">
            Podemos actualizar estos términos a medida que la plataforma crece. Si hacemos un
            cambio importante, lo vamos a avisar.
          </p>
        </section>

        <p>
          Dudas sobre esto:{" "}
          <a href="/contacto" className="text-accent underline">
            contactanos
          </a>
          .
        </p>
      </div>
    </main>
  );
}
