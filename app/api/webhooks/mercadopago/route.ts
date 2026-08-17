import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { verifyMercadoPagoSignature, isRateLimited } from "@/lib/security";
import { confirmPayment } from "@/app/actions/registrations";
import { prisma } from "@/lib/prisma";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

export async function POST(req: NextRequest) {
  // Capa 1 — rate limiting básico por IP, para que un endpoint público
  // no se pueda usar para bombardear la base de datos con requests falsos
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`mp-webhook:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const dataId = body?.data?.id;
  if (!dataId) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  // Capa 2 — verificación de firma: rechazamos cualquier notificación que
  // no venga realmente de Mercado Pago antes de tocar la base de datos
  const isValidSignature = verifyMercadoPagoSignature({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId: String(dataId),
    secret: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
  });

  if (!isValidSignature) {
    // No damos detalles del motivo del rechazo en la respuesta — no le
    // regalamos información útil a alguien que esté probando falsificar firmas
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // Capa 3 — nunca confiamos en el "status" que venga en el body del
  // webhook: siempre volvemos a preguntarle a la API de Mercado Pago cuál
  // es el estado real de ese pago específico, usando nuestro access token
  const paymentClient = new Payment(mpClient);
  const payment = await paymentClient.get({ id: dataId });

  const registrationId = payment.external_reference;
  if (!registrationId) {
    return NextResponse.json({ error: "Pago sin referencia de inscripción" }, { status: 400 });
  }

  const approved = payment.status === "approved";

  // La misma Preference sirve dos casos de uso (inscripción a torneo,
  // compra en la tienda) — el prefijo en external_reference es lo que
  // distingue a cuál de los dos confirmarle el pago
  if (registrationId.startsWith("product-order:")) {
    const orderId = registrationId.replace("product-order:", "");
    await prisma.productOrder.update({
      where: { id: orderId },
      data: { status: approved ? "APPROVED" : "REJECTED" },
    });
  } else {
    await confirmPayment(registrationId, approved);
  }

  return NextResponse.json({ received: true });
}
