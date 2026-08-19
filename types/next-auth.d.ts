import { DefaultSession } from "next-auth";

// Sin este archivo, TypeScript no tiene forma de saber que le agregamos
// "role" e "id" a la sesión en los callbacks de auth.ts — accede a
// session.user.role en 33 lugares del proyecto, y sin esta declaración
// cada uno de esos usos es un error de tipo real en el build (el mismo
// tipo de error, en el mismo paso, que ya rompió el build dos veces por
// otras razones — mejor prevenir este antes de que aparezca).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
