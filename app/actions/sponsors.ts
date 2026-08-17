"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/auth";
import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/security";

const sponsorSchema = z.object({
  tournamentId: z.string(),
  name: z.string().trim().min(2).max(60),
  logoUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  tier: z.enum(["BASIC", "FEATURED"]).default("BASIC"),
});

export async function addSponsor(input: z.infer<typeof sponsorSchema>) {
  assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);
  const data = sponsorSchema.parse(input);

  const tournament = await prisma.tournament.findUnique({
    where: { id: data.tournamentId },
    include: { organizer: true },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.organizer.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Este torneo no te pertenece");
  }

  const sponsor = await prisma.sponsor.create({ data });
  revalidatePath(`/torneos/${data.tournamentId}`);
  return sponsor;
}

export async function removeSponsor(sponsorId: string) {
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
    include: { tournament: { include: { organizer: true } } },
  });
  if (!sponsor) return;
  if (sponsor.tournament.organizer.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Este torneo no te pertenece");
  }

  await prisma.sponsor.delete({ where: { id: sponsorId } });
  revalidatePath(`/torneos/${sponsor.tournamentId}`);
}
