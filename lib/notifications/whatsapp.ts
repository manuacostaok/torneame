// Envío de WhatsApp vía Twilio. Es un wrapper chico a propósito — si el
// día de mañana cambiamos de proveedor (ej. WhatsApp Business API directa
// de Meta), el resto del código solo conoce sendWhatsAppMessage(), no
// Twilio puntualmente.

const TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"; // sandbox number de ejemplo

export async function sendWhatsAppMessage(toPhoneE164: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    console.warn("Twilio no configurado — se omite el envío de WhatsApp");
    return { sent: false, reason: "not_configured" as const };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: `whatsapp:${toPhoneE164}`,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      console.error("Twilio devolvió un error al enviar WhatsApp", await response.text());
      return { sent: false, reason: "provider_error" as const };
    }
    return { sent: true };
  } catch (error) {
    // Un WhatsApp que no sale NUNCA puede tirar abajo la acción que lo
    // dispara (ej. publicar un torneo) — se loguea y se sigue de largo,
    // la notificación in-app (que sí es confiable) ya se mandó aparte.
    console.error("Error de red enviando WhatsApp", error);
    return { sent: false, reason: "network_error" as const };
  }
}

/**
 * Solo manda si el usuario cargó teléfono Y dio opt-in explícito — nunca
 * asumimos consentimiento por default, spammear WhatsApp de la gente
 * quema la marca rápido y puede meternos en problemas legales.
 */
export async function notifyUserByWhatsApp(
  user: { phone: string | null; whatsappOptIn: boolean },
  message: string
) {
  if (!user.phone || !user.whatsappOptIn) return { sent: false, reason: "opted_out" as const };
  return sendWhatsAppMessage(user.phone, message);
}
