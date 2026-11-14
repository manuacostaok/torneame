import { defineConfig } from "vitest/config";
import path from "path";

// Espeja el alias "@/*" -> "./*" de tsconfig.json — sin esto, cualquier
// test que importe algo con "@/" (server actions, auth.ts, lib/prisma)
// falla a nivel de resolución de módulos antes de llegar a correr.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
