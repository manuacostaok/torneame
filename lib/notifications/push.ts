import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Las VAPID keys se generan una sola vez por proyecto (no por usuario) con
// `npx web-push generate-vapid-keys` y quedan fijas — identifican a
// nuestro servidor frente a los servicios push de Chrome/Firefox/Safari.
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:soporte@torneame.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Le manda un push a TODOS los dispositivos suscriptos de un usuario
 * (puede tener el celular y la compu a la vez). Si un endpoint quedó
 * viejo/inválido (410 Gone es la respuesta típica cuando el usuario
 * desinstaló la app o limpió el navegador), lo borramos de la base en
 * vez de seguir intentando mandarle para siempre.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) {
    console.warn("VAPID no configurado — se omite el push");
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Error enviando push", error);
        }
      }
    })
  );
}
