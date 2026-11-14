import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-strong/30 px-4 py-10">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="font-medium">Torneame</p>
          <p className="mt-1 text-xs text-secondary">Tu torneo, sin el quilombo.</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Producto</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-secondary">
            <li><Link href="/torneos">Torneos</Link></li>
            <li><Link href="/ranking">Ranking</Link></li>
            <li><Link href="/organizador/torneos/nuevo">Crear torneo</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Compañía</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-secondary">
            <li><Link href="/sobre-nosotros">Sobre nosotros</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Legal</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-secondary">
            <li><Link href="/terminos">Términos</Link></li>
            <li><Link href="/privacidad">Privacidad</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Torneame. Hecho en Argentina.</p>
        <p className="text-[11px] tracking-wide">Desarrollado por Aura Soft Solutions</p>
      </div>
    </footer>
  );
}
