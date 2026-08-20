export const metadata = { title: "Contacto — Torneame" };

export default function ContactoPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-2xl font-medium">Contacto</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm text-secondary sm:text-base">
        <p>
          ¿Encontraste un problema, tenés una duda o querés proponer algo? Escribinos directo:
        </p>
        <a
          href="mailto:hola@torneame.app"
          className="inline-block w-fit rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          hola@torneame.app
        </a>
        <p className="text-xs text-muted">
          Casilla de ejemplo — reemplazala por tu email real de soporte antes de publicar.
        </p>
      </div>
    </main>
  );
}
