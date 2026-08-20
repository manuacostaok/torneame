import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { verifyMercadoPagoSignature, isRateLimited } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { activateProPlan } from "@/app/actions/plan";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

// Las inscripciones a torneo ya no pasan por acá — se pagan por
// transferencia directa al organizador (ver app/actions/registrations.ts).
// Lo que sigue cobrándose con Mercado Pago de verdad son dos cosas, con
// dos formatos de notificación distintos:
// - "payment": pedidos de la tienda de merchandising (cobro único).
// - "subscription_preapproval" / "subscription_authorized_payment": el
//   plan PRO (suscripción recurrente).
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
  // no venga realmente de Mercado Pago antes de tocar la base de datos.
  // El manifest de la firma es el mismo para los tres tipos de
  // notificación (solo depende de data.id, no del tipo de recurso).
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

  // Suscripción del plan PRO — se activa cuando Mercado Pago autoriza la
  // suscripción (primer cobro exitoso), nunca por lo que diga el cliente
  if (body.type === "subscription_preapproval") {
    const preapproval = await new PreApproval(mpClient).get({ id: dataId });
    if (preapproval.status === "authorized" && preapproval.external_reference) {
      await activateProPlan(preapproval.external_reference);
    }
    return NextResponse.json({ received: true });
  }

  // Cada cobro mensual de la suscripción manda esto — lo usamos para
  // extender otro mes el plan PRO. El SDK no tiene un cliente para este
  // recurso, así que se pide directo a la REST API con el mismo access
  // token que usa el resto de la integración.
  if (body.type === "subscription_authorized_payment") {
    const authorizedPaymentRes = await fetch(
      `https://api.mercadopago.com/authorized_payments/${dataId}`,
      { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
    );
    if (!authorizedPaymentRes.ok) {
      return NextResponse.json({ error: "No se pudo verificar el cobro" }, { status: 502 });
    }
    const authorizedPayment = await authorizedPaymentRes.json();
    if (authorizedPayment.status === "processed" && authorizedPayment.preapproval_id) {
      const preapproval = await new PreApproval(mpClient).get({
        id: authorizedPayment.preapproval_id,
      });
      if (preapproval.external_reference) {
        await activateProPlan(preapproval.external_reference);
      }
    }
    return NextResponse.json({ received: true });
  }

  // "payment" (default): pagos únicos — solo la tienda por ahora
  const paymentClient = new Payment(mpClient);
  const payment = await paymentClient.get({ id: dataId });

  const externalReference = payment.external_reference;
  if (!externalReference?.startsWith("product-order:")) {
    return NextResponse.json({ error: "Referencia externa inválida" }, { status: 400 });
  }

  const approved = payment.status === "approved";
  const orderId = externalReference.replace("product-order:", "");
  await prisma.productOrder.update({
    where: { id: orderId },
    data: { status: approved ? "APPROVED" : "REJECTED" },
  });

  return NextResponse.json({ received: true });
}
