// Datos públicos del sitio. El email de contacto puede pisarse por
// despliegue con NEXT_PUBLIC_CONTACT_EMAIL (Vercel → Environment Variables);
// si no está seteada se usa la casilla de Aura Soft Solutions.
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "aurasoftsolution@hotmail.com";

/** Fecha de la última revisión de los textos legales — se actualiza a mano al cambiarlos. */
export const LEGAL_LAST_UPDATED = "14 de noviembre de 2026";
