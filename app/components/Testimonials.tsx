// Placeholder estructural: todavía no tenemos organizadores usando la
// plataforma en producción, así que no hay testimonios reales para
// mostrar. Dejo la sección lista (mismo layout que va a usar el contenido
// real) para no tener que rehacerla después del piloto con Team Coronel —
// pero esto NO se sube a producción con texto inventado; se completa con
// citas reales apenas tengamos el primer torneo corrido en la plataforma.

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <h2 className="text-center text-xl font-medium sm:text-2xl">Lo que dicen los organizadores</h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.author} className="rounded-xl bg-surface-1 p-5">
            <p className="text-sm">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-3 text-sm font-medium">{t.author}</p>
            <p className="text-xs text-muted">{t.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
