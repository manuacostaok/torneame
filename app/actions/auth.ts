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

const organizerProfileSchema = z.object({
  orgName: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .min(3)
    .max(40),
  bio: z.string().trim().max(300).optional(),
  // Alias/CBU/lo que sea para que le transfieran la inscripción de los
  // torneos pagos directo — opcional acá porque puede armar solo torneos
  // gratis, o cargarlo más adelante antes de publicar uno pago.
  paymentAlias: z.string().trim().max(60).optional(),
});

/**
 * Segundo paso del alta de un organizador — el registro (registerUser)
 * solo crea el User, porque pedirle orgName/slug/bio en el mismo
 * formulario que el email/contraseña es fricción de más para alguien que
 * todavía no decidió cómo se va a llamar su marca.
 *
 * Cualquier usuario logueado puede pasar por acá, no solo los que se
 * registraron como ORGANIZER — es como un jugador se convierte en
 * organizador sin perder su cuenta ni su perfil de jugador (un User puede
 * tener PlayerProfile y OrganizerProfile a la vez). Si todavía tiene rol
 * PLAYER, lo promovemos acá; el cliente refresca la sesión con
 * useSession().update() para que el rol nuevo valga sin tener que reloguear.
 */
export async function createOrganizerProfile(input: z.infer<typeof organizerProfileSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const data = organizerProfileSchema.parse(input);

  const existing = await prisma.organizerProfile.findUnique({ where: { userId: session.user.id } });
  if (existing) throw new Error("Ya tenés un perfil de organizador");

  const slugTaken = await prisma.organizerProfile.findUnique({ where: { slug: data.slug } });
  if (slugTaken) throw new Error("Ese nombre de usuario ya está en uso, probá otro");

  const profile = await prisma.organizerProfile.create({
    data: {
      userId: session.user.id,
      orgName: data.orgName,
      slug: data.slug,
      bio: data.bio,
      paymentAlias: data.paymentAlias,
    },
  });

  if (session.user.role === "PLAYER") {
    await prisma.user.update({ where: { id: session.user.id }, data: { role: "ORGANIZER" } });
  }

  return profile;
}

/** Para actualizar el alias de pago después de creado el perfil (ej. si lo cambió de banco). */
export async function updatePaymentAlias(paymentAlias: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const alias = paymentAlias.trim().slice(0, 60);

  const organizer = await prisma.organizerProfile.findUnique({ where: { userId: session.user.id } });
  if (!organizer) throw new Error("No tenés perfil de organizador");

  return prisma.organizerProfile.update({
    where: { userId: session.user.id },
    data: { paymentAlias: alias || null },
  });
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

/** Edita nombre y foto de perfil — el email no se puede tocar acá porque es la credencial de login. */
export async function updateProfile(input: z.infer<typeof updateProfileSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const data = updateProfileSchema.parse(input);

  return prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name, avatarUrl: data.avatarUrl || null },
  });
}
