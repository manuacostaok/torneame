const STEPS = [
  { title: "Elegí un torneo", desc: "Filtrá por juego, ciudad o fecha y mirá el premio y los cupos en vivo." },
  { title: "Inscribite y pagá", desc: "Transferís directo al organizador y subís el comprobante — sin comprobantes perdidos en un chat de WhatsApp." },
  { title: "Jugá y seguí tu bracket", desc: "Resultados y cruces en vivo, desde el celular, sin esperar que alguien anuncie el próximo rival." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <h2 className="text-center text-xl font-medium sm:text-2xl">Cómo funciona</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface-1 text-sm font-medium text-accent">
              {i + 1}
            </div>
            <p className="mt-3 font-medium">{step.title}</p>
            <p className="mt-1 text-sm text-secondary">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
