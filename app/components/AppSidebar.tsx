"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";

type IconName = "home" | "trophy" | "gamepad" | "clipboard" | "plus" | "shield" | "crown" | "user";

interface NavLink {
  href: string;
  label: string;
  // Label corto para la barra inferior de mobile — cortar el label largo
  // por el primer espacio dejaba cosas como "Mi" o "Panel" sin sentido.
  short: string;
  icon: IconName;
}

// Íconos en trazo (estilo Lucide) en vez de emojis: se renderizan igual en
// todos los sistemas, heredan el color del texto y escalan sin pixelarse.
const ICON_PATHS: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  trophy:
    "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  gamepad:
    "M6 12h4M8 10v4M15 13h.01M18 11h.01M17.3 5H6.7a4 4 0 0 0-3.9 3.1l-1.5 6.6A3 3 0 0 0 7 17.5L8.5 16h7l1.5 1.5a3 3 0 0 0 5.7-2.8l-1.5-6.6A4 4 0 0 0 17.3 5z",
  clipboard:
    "M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1zM8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M9 12h6M9 16h6",
  plus: "M12 8v8M8 12h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  crown: "M3 7l4 4 5-6 5 6 4-4-2 12H5z",
  user: "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

function NavIcon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

// Barra de accesos directos persistente para cualquier usuario logueado —
// sin esto, después de una acción (crear un torneo, editar el perfil) no
// había forma de volver al dashboard o al inicio salvo escribiendo la URL
// a mano. Un solo componente que se adapta: sidebar fija a la izquierda
// en desktop, barra de íconos abajo en mobile.
//
// Los links salen solo del rol que ya viene en la sesión (JWT) — sin
// consultar la base si tiene PlayerProfile/OrganizerProfile. Un poco menos
// preciso (ej. un ORGANIZER recién registrado que todavía no completó su
// perfil ve "Panel de organizador" en vez de "Completar perfil"), pero esa
// página ya redirige sola a completar el perfil si hace falta — y evita
// una query a la base en cada render del sidebar.
export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  // No importa isAdmin() de auth.ts a propósito — ese archivo arrastra
  // configuración server-only (PrismaAdapter, etc.) que no puede entrar
  // al bundle del cliente. Es la misma regla (SUPERADMIN incluye ADMIN)
  // repetida acá nomás, no hay forma limpia de compartirla sin romper el
  // build.
  const isAdminRole = role === "ADMIN" || role === "SUPERADMIN";

  const links: NavLink[] = [
    { href: "/", label: "Inicio", short: "Inicio", icon: "home" },
    { href: "/torneos", label: "Torneos", short: "Torneos", icon: "trophy" },
    { href: "/jugador/dashboard", label: "Panel de jugador", short: "Jugador", icon: "gamepad" },
    role === "ORGANIZER" || isAdminRole
      ? {
          href: "/organizador/dashboard",
          label: "Panel de organizador",
          short: "Organizar",
          icon: "clipboard",
        }
      : { href: "/organizador/perfil/nuevo", label: "Crear torneo", short: "Crear", icon: "plus" },
    ...(isAdminRole
      ? [{ href: "/admin", label: "Admin", short: "Admin", icon: "shield" as const }]
      : []),
    ...(role === "SUPERADMIN"
      ? [{ href: "/superadmin", label: "Superadmin", short: "Super", icon: "crown" as const }]
      : []),
    { href: "/perfil", label: "Mi perfil", short: "Perfil", icon: "user" },
  ];

  return (
    <>
      {/* Desktop: sidebar fija a la izquierda */}
      <aside
        aria-label="Navegación principal"
        className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-strong bg-surface-1 px-3 py-6 sm:flex"
      >
        <Link
          href="/"
          className="mb-6 px-2 text-lg font-medium"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Torneame
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-200 ${
                  active ? "bg-primary/10 text-accent" : "text-secondary hover:bg-surface-2"
                }`}
              >
                <NavIcon name={l.icon} className="h-5 w-5 flex-shrink-0" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <SignOutButton className="min-h-11 px-2 text-left text-xs text-secondary underline" />
      </aside>

      {/* Mobile: barra de accesos fija abajo */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-strong bg-surface-1 pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-label={l.label}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-200 ${
                active ? "text-accent" : "text-secondary"
              }`}
            >
              <NavIcon name={l.icon} className="h-5 w-5" />
              {l.short}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
