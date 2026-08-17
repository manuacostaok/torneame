"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/security";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["PLAYER", "ORGANIZER"]),
  referralCode: z.string().optional(),
});

export async function registerUser(input: z.infer<typeof registerSchema>) {
  if (isRateLimited(`register:${input.email}`, 5, 60_000)) {
    throw new Error("Demasiados intentos. Esperá un minuto.");
  }

  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Ya existe una cuenta con ese email");

  let referredById: string | null = null;
  if (data.referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: data.referralCode } });
    // Si el código no existe, no rompemos el registro por eso — el
    // referido no se pierde, simplemente no queda atado a nadie
    referredById = referrer?.id ?? null;
  }

  const passwordHash = await hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      referredById,
      ...(data.role === "PLAYER"
        ? { playerProfile: { create: { gamertag: data.name.split(" ")[0].toLowerCase() } } }
        : {}),
      // El organizador todavía tiene que completar orgName/slug en un
      // segundo paso (app/organizador/perfil/nuevo) — acá solo se crea el
      // usuario, no forzamos todos los datos del organizador de una
    },
  });

  return { id: user.id, role: user.role };
}
