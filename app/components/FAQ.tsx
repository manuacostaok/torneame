const FAQS = [
  {
    q: "¿Cuánto cuesta usar Torneame para organizar un torneo?",
    a: "Es gratis armarlo y publicarlo. Cobramos una comisión chica solo sobre las inscripciones que efectivamente se pagan — si no cobrás inscripción, no pagás nada.",
  },
  {
    q: "¿Puedo organizar un torneo presencial, no solo online?",
    a: "Sí, es el caso de uso principal: cargás la dirección del lugar, la gente se inscribe y paga antes, y vos manejás check-in y resultados desde el celular el día del evento.",
  },
  {
    q: "¿Tengo que usar un juego de la lista?",
    a: "No, podés cargar cualquier juego — no hay una lista cerrada.",
  },
  {
    q: "¿Cómo cobro las inscripciones?",
    a: "Integrado con Mercado Pago. El jugador paga al inscribirse y el dinero te llega a vos, menos nuestra comisión.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <h2 className="text-center text-xl font-medium sm:text-2xl">Preguntas frecuentes</h2>
      <div className="mt-6 flex flex-col gap-2">
        {FAQS.map((item) => (
          <details key={item.q} className="rounded-md bg-surface-1 p-4">
            <summary className="cursor-pointer text-sm font-medium">{item.q}</summary>
            <p className="mt-2 text-sm text-secondary">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
