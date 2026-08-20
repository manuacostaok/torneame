export const metadata = { title: "Sobre nosotros — Torneame" };

export default function SobreNosotrosPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-2xl font-medium">Sobre nosotros</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm text-secondary sm:text-base">
        <p>
          Torneame nació de un problema concreto: organizar un torneo presencial de fighting
          games o cualquier otro juego a mano, con planillas, transferencias por WhatsApp y
          brackets armados a ojo, es un quilombo. Vimos de cerca cómo lo resolvía un organizador
          real (Team Coronel, con sus torneos de Mortal Kombat y Ultimate Mortal Kombat 3 en
          Buenos Aires) y construimos la herramienta que le faltaba.
        </p>
        <p>
          La idea es simple: que armar un torneo — presencial u online, de cualquier juego, de
          1v1 a 11v11 — sea tan fácil como cargar unos datos y dejar que la plataforma haga el
          resto. Bracket automático, cobro de inscripciones directo entre organizador y jugador
          (nosotros no nos metemos en el medio ni cobramos comisión), resultados en vivo desde el
          celular.
        </p>
        <p>
          Somos un equipo chico en Argentina, todavía en etapa temprana — si algo no funciona
          como debería, queremos saberlo.{" "}
          <a href="/contacto" className="text-accent underline">
            Escribinos
          </a>
          .
        </p>
      </div>
    </main>
  );
}
