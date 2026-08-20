export const metadata = { title: "Privacidad — Torneame" };

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-2xl font-medium">Privacidad</h1>
      <p className="mt-2 text-xs text-muted">
        Última actualización: {new Date().toLocaleDateString("es-AR")}
      </p>

      <div className="mt-6 flex flex-col gap-5 text-sm text-secondary sm:text-base">
        <p className="rounded-md bg-surface-1 p-3 text-xs text-muted">
          Este es un borrador simple, en criollo — no reemplaza la revisión de un abogado.
          Antes de publicar de verdad, conviene que alguien con conocimiento legal lo revise.
        </p>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Qué datos guardamos</h2>
          <ul className="mt-1 list-inside list-disc">
            <li>Cuenta: nombre, email, contraseña (encriptada, nunca la vemos en texto plano).</li>
            <li>Perfil: gamertag, foto de perfil (si subís una), teléfono (si lo cargás para WhatsApp).</li>
            <li>
              Torneos: inscripciones, resultados de partidos, y el comprobante de pago que subís
              al inscribirte a un torneo pago (se guarda en Cloudinary, un servicio de terceros
              para almacenar imágenes).
            </li>
            <li>Uso: qué torneos seguís, notificaciones que recibiste.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Para qué lo usamos</h2>
          <p className="mt-1">
            Para que la plataforma funcione: mostrarte tus torneos, calcular tu ranking, avisarte
            cuando un organizador que seguís publica algo nuevo (por notificación push o WhatsApp,
            solo si lo activaste vos), y para que el organizador de un torneo pago pueda revisar tu
            comprobante de pago.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Con quién lo compartimos</h2>
          <p className="mt-1">
            Con nadie que no necesite verlo para que la plataforma funcione: el organizador de un
            torneo ve tu comprobante de pago cuando te inscribís a ese torneo puntual; otros
            jugadores ven tu nombre, gamertag y ranking (son públicos, como en cualquier
            plataforma de torneos). Usamos Cloudinary para guardar imágenes y Mercado Pago para
            procesar el pago del plan PRO de los organizadores — no vendemos tus datos a nadie.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[var(--text-primary)]">Tus datos, tus decisiones</h2>
          <p className="mt-1">
            Podés pedirnos que corrijamos o borremos tu cuenta y tus datos en cualquier momento
            escribiéndonos.
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
