"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

// Client component a propósito, igual que AppShell — así la landing sigue
// siendo estática (ISR) y esto resuelve la sesión en el navegador en vez
// de forzar el render dinámico de toda la página. Si ya estás logueado no
// tiene sentido invitarte a crear una cuenta — y la sidebar ya te da
// acceso a todo lo demás, así que directamente no mostramos nada acá.
export function NavAuthCTA() {
  const { data: session } = useSession();

  if (session?.user) return null;

  return (
    <Link href="/registro" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
      Crear cuenta
    </Link>
  );
}
