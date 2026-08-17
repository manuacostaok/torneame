"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function subscribeToPush(subscription: z.infer<typeof subscriptionSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const data = subscriptionSchema.parse(subscription);

  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: {
      userId: session.user.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    },
    update: { userId: session.user.id }, // por si el mismo endpoint pasó a otra cuenta en el mismo dispositivo
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
