import { PrismaClient } from "@prisma/client";

// Patrón singleton estándar para evitar abrir demasiadas conexiones
// en desarrollo con Next.js (hot reload crearía un cliente nuevo cada vez)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
