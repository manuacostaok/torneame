"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/auth";
import { assertSameOrigin } from "@/lib/security";
import { revalidatePath } from "next/cache";

// Estas acciones son SOLO para SUPERADMIN (no se expanden a ADMIN como el
// resto de requireRole(["ADMIN", ...]) — dar/sacar acceso es más sensible
// que las tareas operativas del panel de /admin).

const assignableRoles = ["PLAYER", "ORGANIZER", "ADMIN"] as const;

/**
 * Cambia el rol de un usuario — PLAYER, ORGANIZER o ADMIN. SUPERADMIN no
 * es asignable desde acá a propósito: es demasiado sensible para un
 * toggle en una UI, se hace a mano en la base si hace falta uno nuevo.
 */
export async function setUserRole(userId: string, role: (typeof assignableRoles)[number]) {
  await assertSameOrigin();
  const session = await requireRole(["SUPERADMIN"]);

  if (!assignableRoles.includes(role)) throw new Error("Rol inválido");
  if (userId === session.user.id) throw new Error("No te podés cambiar el rol a vos mismo");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");
  if (user.role === "SUPERADMIN") throw new Error("No podés cambiar el rol de otro superadmin");

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/superadmin");
}

/**
 * Suspende o restaura el acceso de una cuenta — no borra nada, solo le
 * bloquea el login (ver el chequeo en auth.ts). Sirve para una cuenta que
 * está estafando, acosando, o cualquier caso que amerite cortar el acceso
 * sin destruir el historial de torneos/pagos/etc.
 */
export async function setUserSuspended(userId: string, suspended: boolean) {
  await assertSameOrigin();
  const session = await requireRole(["SUPERADMIN"]);

  if (userId === session.user.id) throw new Error("No te podés suspender a vos mismo");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");
  if (user.role === "SUPERADMIN") throw new Error("No podés suspender a otro superadmin");

  await prisma.user.update({ where: { id: userId }, data: { suspended } });
  revalidatePath("/superadmin");
}

const searchSchema = z.object({ query: z.string().trim().max(80) });

/** Busca usuarios por nombre o email — la lista completa sin buscador no escala más allá de un puñado de cuentas. */
export async function searchUsers(query: string) {
  await requireRole(["SUPERADMIN"]);
  const { query: q } = searchSchema.parse({ query });

  return prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      suspended: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
