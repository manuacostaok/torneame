"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, requireRole } from "@/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { isRateLimited } from "@/lib/security";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

const productSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  price: z.number().min(0),
  imageUrl: z.string().url().optional(),
});

export async function createProduct(input: z.infer<typeof productSchema>) {
  const session = await requireRole(["ORGANIZER", "ADMIN"]);
  const data = productSchema.parse(input);

  const organizer = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!organizer) throw new Error("Completá tu perfil de organizador primero");

  return prisma.product.create({ data: { ...data, organizerId: organizer.id } });
}

/**
 * Comprar merchandising reusa exactamente el mismo patrón que inscribirse
 * a un torneo (Preference de Mercado Pago, confirmación solo por webhook)
 * — es la misma pieza de infraestructura de pagos sirviendo un segundo
 * caso de uso, no una integración nueva desde cero.
 */
export async function buyProduct(productId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para comprar");

  if (isRateLimited(`buy-product:${session.user.id}`, 10, 60_000)) {
    throw new Error("Demasiados intentos. Esperá un minuto.");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) throw new Error("Producto no disponible");

  const order = await prisma.productOrder.create({
    data: { productId, buyerId: session.user.id, status: "PENDING" },
  });

  const preference = new Preference(mpClient);
  const result = await preference.create({
    body: {
      items: [{ id: product.id, title: product.name, quantity: 1, unit_price: Number(product.price) }],
      external_reference: `product-order:${order.id}`,
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.APP_URL}/tienda/gracias`,
        failure: `${process.env.APP_URL}/tienda`,
      },
    },
  });

  return { orderId: order.id, checkoutUrl: result.init_point };
}
