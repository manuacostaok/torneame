"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";

interface NavLink {
  href: string;
  label: string;
  icon: string;
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
    { href: "/", label: "Inicio", icon: "🏠" },
    { href: "/torneos", label: "Torneos", icon: "🏆" },
    { href: "/jugador/dashboard", label: "Panel de jugador", icon: "🎮" },
    role === "ORGANIZER" || isAdminRole
      ? { href: "/organizador/dashboard", label: "Panel de organizador", icon: "📋" }
      : { href: "/organizador/perfil/nuevo", label: "Crear torneo", icon: "➕" },
    ...(isAdminRole ? [{ href: "/admin", label: "Admin", icon: "🛠️" }] : []),
    ...(role === "SUPERADMIN"
      ? [{ href: "/superadmin", label: "Superadmin", icon: "👑" }]
      : []),
    { href: "/perfil", label: "Mi perfil", icon: "👤" },
  ];

  return (
    <>
      {/* Desktop: sidebar fija a la izquierda */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-strong bg-surface-1 px-3 py-6 sm:flex">
        <Link
          href="/"
          className="mb-6 px-2 text-lg font-medium"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Torneame
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
                pathname === l.href
                  ? "bg-primary/10 text-accent"
                  : "text-secondary hover:bg-surface-2"
              }`}
            >
              <span aria-hidden="true">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <SignOutButton className="px-2 text-left text-xs text-secondary underline" />
      </aside>

      {/* Mobile: barra de accesos fija abajo */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-strong bg-surface-1 py-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center gap-0.5 px-2 text-[10px] ${
              pathname === l.href ? "text-accent" : "text-secondary"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              {l.icon}
            </span>
            {l.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </>
  );
}
