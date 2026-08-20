import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;
        // Mismo error genérico que credenciales inválidas a propósito —
        // no le confirmamos a quien intenta loguearse que la cuenta
        // existe pero está suspendida
        if (user.suspended) return null;

        const valid = await compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    // Se inyecta el id y el rol en el JWT y en la sesión para poder
    // proteger rutas de organizador/admin y filtrar por dueño sin
    // pegarle a la base de datos en cada request
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      // Se dispara con el `update()` de useSession() del lado del cliente —
      // lo usamos cuando un jugador se convierte en organizador, para que
      // el rol nuevo valga en el resto de la sesión sin pedirle reloguear.
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

/**
 * Helper de autorización para usar en server actions y route handlers.
 * Uso: await requireRole(["ORGANIZER", "ADMIN"])
 *
 * Si "ADMIN" está en la lista, SUPERADMIN también pasa — es un
 * superconjunto de permisos, no hace falta acordarse de escribir los dos
 * roles en cada llamada.
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  const effectiveRoles = allowedRoles.includes("ADMIN")
    ? [...allowedRoles, "SUPERADMIN"]
    : allowedRoles;
  if (!effectiveRoles.includes(session.user.role)) {
    throw new Error("No tenés permiso para hacer esto");
  }
  return session;
}

/** SUPERADMIN tiene todo lo que tiene ADMIN, y más — usar esto en vez de comparar contra "ADMIN" a mano. */
export function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}
