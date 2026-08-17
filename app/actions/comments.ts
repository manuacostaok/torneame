"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRateLimited } from "@/lib/security";

const commentSchema = z.object({
  tournamentId: z.string(),
  // .trim() en el propio schema para que un comentario de solo espacios
  // no pase la validación de "al menos 1 caracter"
  body: z
    .string()
    .trim()
    .min(1, "El comentario no puede estar vacío")
    .max(500, "Máximo 500 caracteres"),
});

export async function postComment(input: z.infer<typeof commentSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para comentar");

  // Evita spam/flood de comentarios desde un mismo usuario
  if (isRateLimited(`comment:${session.user.id}`, 5, 60_000)) {
    throw new Error("Estás comentando muy rápido. Esperá un minuto.");
  }

  const data = commentSchema.parse(input);

  const comment = await prisma.comment.create({
    data: { tournamentId: data.tournamentId, authorId: session.user.id, body: data.body },
    include: { author: { select: { name: true, avatarUrl: true } } },
  });

  revalidatePath(`/torneos/${data.tournamentId}`);
  return comment;
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comentario no encontrado");
  if (comment.authorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("No podés borrar un comentario que no es tuyo");
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/torneos/${comment.tournamentId}`);
}
