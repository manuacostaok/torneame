import { CONTACT_EMAIL } from "@/lib/site";
import { Footer } from "@/app/components/Footer";

export const metadata = { title: "Contacto" };

export default function ContactoPage() {
  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="text-2xl font-medium">Contacto</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm text-secondary sm:text-base">
          <p>
            ¿Encontraste un problema, tenés una duda o querés proponer algo? Escribinos directo.
          </p>
          {CONTACT_EMAIL ? (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block w-fit rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white"
            >
              {CONTACT_EMAIL}
            </a>
          ) : (
            <p className="rounded-md bg-surface-1 p-3 text-sm">
              Estamos terminando de habilitar el canal de contacto. Volvé a pasar en unos días.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
