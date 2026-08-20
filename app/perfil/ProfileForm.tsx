"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/auth";
import { ImageUploader } from "@/app/components/ImageUploader";
import { useToast } from "@/app/components/Toast";

export function ProfileForm({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  const [formName, setFormName] = useState(name);
  const [formAvatar, setFormAvatar] = useState(avatarUrl);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name: formName, avatarUrl: formAvatar || undefined });
      toast("Perfil actualizado", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo guardar", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ImageUploader value={formAvatar} onChange={setFormAvatar} label="Foto de perfil" />
      <input
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        placeholder="Nombre"
        required
        minLength={2}
        className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
