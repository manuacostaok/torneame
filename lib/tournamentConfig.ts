// Constantes compartidas entre server actions y componentes cliente. Vive
// separado de app/actions/matches.ts a propósito: un archivo "use server"
// en Next.js solo puede exportar funciones async — una constante como esta
// rompería el build si estuviera ahí adentro.

/**
 * Minutos que tienen los dos jugadores para presentarse después de que el
 * organizador los convoca, antes de poder descalificarlos. Mismo orden de
 * magnitud que recomienda start.gg (10-15 min) para el timer de DQ en
 * torneos presenciales de FGC — no es un número inventado.
 */
export const DQ_TIMER_MINUTES = 10;
