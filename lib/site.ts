// Datos públicos del sitio que cambian por despliegue. El email de contacto
// se configura con NEXT_PUBLIC_CONTACT_EMAIL (Vercel → Environment
// Variables) para no publicar una casilla que no existe.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

/** Fecha de la última revisión de los textos legales — se actualiza a mano al cambiarlos. */
export const LEGAL_LAST_UPDATED = "14 de noviembre de 2026";
