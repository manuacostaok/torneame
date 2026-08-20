"use client";

import { useSession } from "next-auth/react";
import { AppSidebar } from "./AppSidebar";

// Client component a propósito: si esto llamara a auth() del lado del
// servidor en el layout raíz, Next.js volvería dinámica TODA la app —
// hasta la landing, que tiene ISR (revalidate=60) justamente para no
// pegarle a la base en cada visita anónima. Con useSession() la sesión se
// resuelve en el navegador, así que el layout server-side sigue siendo
// estático y cacheable para el visitante anónimo (la mayoría del tráfico).
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  if (!session?.user) return <>{children}</>;

  return (
    <>
      <AppSidebar role={session.user.role} />
      <div className="pb-16 sm:pb-0 sm:pl-56">{children}</div>
    </>
  );
}
