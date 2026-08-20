"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/actions/auth";
import { LoginModal } from "@/app/components/LoginModal";
import { useToast } from "@/app/components/Toast";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("rol") === "organizador" ? "ORGANIZER" : "PLAYER";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PLAYER" | "ORGANIZER">(initialRole);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await registerUser({ name, email, password, role });

      // Auto-login: no tiene sentido pedirle a alguien que se acaba de
      // registrar que vuelva a escribir el email y la contraseña en la
      // pantalla de login — es la misma fricción que estamos tratando de
      // sacar del resto del producto.
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast("Cuenta creada — iniciá sesión manualmente", "info");
        router.push("/login");
        return;
      }

      toast("¡Cuenta creada!", "success");
      router.push(role === "ORGANIZER" ? "/organizador/perfil/nuevo" : "/jugador/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo crear la cuenta", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginModal>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setRole("PLAYER")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm ${
            role === "PLAYER" ? "border-primary bg-primary/10 text-accent" : "border-strong"
          }`}
        >
          Soy jugador
        </button>
        <button
          type="button"
          onClick={() => setRole("ORGANIZER")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm ${
            role === "ORGANIZER" ? "border-primary bg-primary/10 text-accent" : "border-strong"
          }`}
        >
          Quiero organizar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          required
          minLength={2}
          className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mínimo 8 caracteres)"
          required
          minLength={8}
          className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-secondary">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="text-accent">
          Iniciá sesión
        </a>
      </p>
    </LoginModal>
  );
}
