// IMPORTANTE — honestidad técnica: esto NO es un modelo de IA/ML
// entrenado. Es un análisis estadístico directo sobre el historial de
// torneos del propio organizador (qué día/horario tuvo más inscriptos
// en el pasado). Le llamamos "sugerencias inteligentes" en la UI, no
// "IA", para no prometer algo que no es. Es exactamente el tipo de
// función que en la vida real se arranca así — simple y honesta — y se
// upgradea a un modelo de verdad el día que haya volumen de datos como
// para que valga la pena (con 3 torneos no hay nada que un modelo de ML
// pueda aprender que un promedio no te diga igual de bien).

export interface PastTournament {
  startsAt: Date;
  registrationCount: number;
  format: string;
  maxPlayers: number;
}

export interface TimingSuggestion {
  dayOfWeek: string;
  hour: number;
  avgRegistrations: number;
  basedOnCount: number;
}

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * Agrupa los torneos pasados por día de la semana + franja horaria (bloques
 * de 3hs) y devuelve la combinación con mejor promedio de inscriptos.
 * Necesita un mínimo de torneos para no sugerir algo basado en una sola
 * muestra — con 1-2 torneos no hay patrón, hay ruido.
 */
export function suggestBestTiming(pastTournaments: PastTournament[]): TimingSuggestion | null {
  const MIN_SAMPLE_SIZE = 3;
  if (pastTournaments.length < MIN_SAMPLE_SIZE) return null;

  const buckets = new Map<string, { total: number; count: number; day: string; hour: number }>();

  for (const t of pastTournaments) {
    const day = t.startsAt.getDay();
    const hourBlock = Math.floor(t.startsAt.getHours() / 3) * 3;
    const key = `${day}-${hourBlock}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.total += t.registrationCount;
      existing.count += 1;
    } else {
      buckets.set(key, { total: t.registrationCount, count: 1, day: DAY_NAMES[day], hour: hourBlock });
    }
  }

  let best: TimingSuggestion | null = null;
  for (const bucket of buckets.values()) {
    const avg = bucket.total / bucket.count;
    if (!best || avg > best.avgRegistrations) {
      best = {
        dayOfWeek: bucket.day,
        hour: bucket.hour,
        avgRegistrations: Math.round(avg * 10) / 10,
        basedOnCount: bucket.count,
      };
    }
  }

  return best;
}

/**
 * Sugerencia de formato: mira si los torneos con formato de eliminación
 * simple sistemáticamente se llenan más rápido/completo que los de doble
 * eliminación o grupos, y lo dice. Regla directa, no aprendizaje —
 * de nuevo, con pocos datos es lo correcto, no una limitación a esconder.
 */
export function suggestBestFormat(pastTournaments: PastTournament[]): string | null {
  const MIN_SAMPLE_SIZE = 3;
  if (pastTournaments.length < MIN_SAMPLE_SIZE) return null;

  const fillRateByFormat = new Map<string, { totalFillRate: number; count: number }>();

  for (const t of pastTournaments) {
    const fillRate = t.registrationCount / t.maxPlayers;
    const existing = fillRateByFormat.get(t.format);
    if (existing) {
      existing.totalFillRate += fillRate;
      existing.count += 1;
    } else {
      fillRateByFormat.set(t.format, { totalFillRate: fillRate, count: 1 });
    }
  }

  let bestFormat: string | null = null;
  let bestAvg = 0;
  for (const [format, data] of fillRateByFormat) {
    const avg = data.totalFillRate / data.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestFormat = format;
    }
  }

  return bestFormat;
}
