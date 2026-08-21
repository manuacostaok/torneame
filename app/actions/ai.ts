"use server";

import { auth, isAdmin } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security";

// Google Gemini — capa gratis generosa (con límite de pedidos por
// minuto/día, no infinita) y lee imágenes además de texto, que es lo que
// necesitamos para las dos funciones de acá. Se pega directo a la REST
// API en vez de sumar el SDK de Google — es una sola llamada, no vale la
// pena la dependencia extra.
const GEMINI_MODEL = "gemini-3.6-flash";

async function callGemini(parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("La IA no está configurada todavía (falta GEMINI_API_KEY)");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  );

  if (!res.ok) {
    throw new Error("La IA no pudo responder ahora, probá de nuevo en un rato");
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("La IA no devolvió nada útil, probá de nuevo");
  }
  return text.trim();
}

/**
 * Genera un texto listo para pegar en WhatsApp/redes invitando a
 * anotarse al torneo — el organizador hoy tiene que escribirlo a mano.
 */
export async function generateTournamentPitch(tournamentId: string) {
  await assertSameOrigin();
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { game: true, organizer: true },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.organizer.userId !== session.user.id && !isAdmin(session.user.role)) {
    throw new Error("Este torneo no te pertenece");
  }

  const prompt = `Escribí un mensaje corto para compartir por WhatsApp o redes sociales invitando a anotarse a este torneo de videojuegos. Español rioplatense (Argentina), tono informal y con onda, algún emoji pero sin abusar, 3 a 5 líneas máximo. No inventes datos que no te doy. Devolvé SOLO el texto del mensaje, sin comillas ni explicación alrededor.

Datos del torneo:
- Nombre: ${tournament.name}
- Juego: ${tournament.game.name}
- Modo: ${tournament.mode}
- ${tournament.locationType === "PRESENCIAL" ? `Presencial en ${tournament.venueAddress ?? "lugar a confirmar"}` : "Online"}
- Empieza: ${tournament.startsAt.toLocaleString("es-AR")}
- Cierre de inscripción: ${tournament.registrationDeadline.toLocaleString("es-AR")}
- Cupo: ${tournament.maxPlayers} jugadores
- Inscripción: ${Number(tournament.entryFee) === 0 ? "gratis" : `$${Number(tournament.entryFee).toLocaleString("es-AR")}`}
- Premio: $${Number(tournament.prizePoolBase).toLocaleString("es-AR")}
- Organiza: ${tournament.organizer.orgName}
- Link: ${process.env.APP_URL}/torneos/${tournament.id}`;

  return callGemini([{ text: prompt }]);
}

/**
 * Ayuda al organizador a revisar un comprobante de transferencia — lee la
 * imagen y compara el monto que aparece contra lo que se espera. Es una
 * ASISTENCIA, no una aprobación automática: el organizador sigue siendo
 * quien decide "Pasa"/"No pasa" en /organizador/pagos, esto solo le da
 * una pista antes de mirar la imagen a ojo.
 */
export async function analyzePaymentReceipt(registrationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournament: { include: { organizer: true } }, payment: true },
  });
  if (!registration) throw new Error("Inscripción no encontrada");
  if (
    registration.tournament.organizer.userId !== session.user.id &&
    !isAdmin(session.user.role)
  ) {
    throw new Error("Este torneo no te pertenece");
  }
  if (!registration.payment?.receiptImageUrl) {
    throw new Error("Esta inscripción no tiene comprobante para revisar");
  }

  const imageRes = await fetch(registration.payment.receiptImageUrl);
  if (!imageRes.ok) throw new Error("No se pudo descargar el comprobante");
  const imageBuffer = await imageRes.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const mimeType = imageRes.headers.get("content-type") ?? "image/png";

  const expectedAmount = Number(registration.payment.amount);
  const prompt = `Esto es una captura de un comprobante de transferencia bancaria/billetera virtual argentina. Se espera que el monto transferido sea $${expectedAmount}. Mirá la imagen y respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta forma exacta:
{"esComprobante": boolean, "montoEncontrado": number o null, "coincide": boolean, "nota": "una frase corta explicando qué viste"}
"coincide" es true solo si el monto que ves en la imagen es igual (o razonablemente cercano, redondeos de centavos) a $${expectedAmount}.`;

  const raw = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: base64Image } },
  ]);

  try {
    // El modelo a veces envuelve el JSON en ```json ... ``` a pesar de que
    // se lo pedimos sin eso — lo sacamos si aparece, mejor a que rompa el parseo
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      esComprobante: Boolean(parsed.esComprobante),
      montoEncontrado: typeof parsed.montoEncontrado === "number" ? parsed.montoEncontrado : null,
      coincide: Boolean(parsed.coincide),
      nota: typeof parsed.nota === "string" ? parsed.nota : "",
    };
  } catch {
    // Si la IA no devolvió JSON parseable, no rompemos el flujo — el
    // organizador igual puede revisar la imagen a ojo, esto es solo ayuda
    return { esComprobante: false, montoEncontrado: null, coincide: false, nota: raw.slice(0, 200) };
  }
}
