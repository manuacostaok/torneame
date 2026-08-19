"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
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

const playerProfileSchema = z.object({
  gamertag: z.string().trim().min(2).max(30),
});

/**
 * En el flujo normal esto nunca se usa — registerUser ya crea el
 * PlayerProfile en el mismo paso. Existe como red de contención para
 * cuentas que puedan quedar sin perfil por otra vía (ej. una cuenta
 * cargada a mano desde el panel de admin).
 */
export async function createPlayerProfile(input: z.infer<typeof playerProfileSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const existing = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
  if (existing) throw new Error("Ya tenés un perfil de jugador");

  const data = playerProfileSchema.parse(input);
  return prisma.playerProfile.create({ data: { userId: session.user.id, gamertag: data.gamertag } });
}
  orgName: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .min(3)
    .max(40),
  bio: z.string().trim().max(300).optional(),
});

/**
 * Segundo paso del alta de un organizador — el registro (registerUser)
 * solo crea el User, porque pedirle orgName/slug/bio en el mismo
 * formulario que el email/contraseña es fricción de más para alguien que
 * todavía no decidió cómo se va a llamar su marca.
 */
export async function createOrganizerProfile(input: z.infer<typeof organizerProfileSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");
  if (session.user.role !== "ORGANIZER") throw new Error("Esta cuenta no es de organizador");

  const data = organizerProfileSchema.parse(input);

  const existing = await prisma.organizerProfile.findUnique({ where: { userId: session.user.id } });
  if (existing) throw new Error("Ya tenés un perfil de organizador");

  const slugTaken = await prisma.organizerProfile.findUnique({ where: { slug: data.slug } });
  if (slugTaken) throw new Error("Ese nombre de usuario ya está en uso, probá otro");

  return prisma.organizerProfile.create({
    data: { userId: session.user.id, orgName: data.orgName, slug: data.slug, bio: data.bio },
  });
}
