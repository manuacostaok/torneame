"use client";

import { useRef, useState } from "react";

// Subida directa del navegador a Cloudinary vía "unsigned upload preset" —
// el archivo nunca pasa por nuestro servidor (evita el límite de tamaño de
// body de las funciones serverless de Vercel) y el API secret de Cloudinary
// nunca se expone al cliente, solo el cloud name y el preset (que se puede
// restringir en el panel de Cloudinary a subidas de imagen, tamaño máximo, etc.).
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const MAX_FILE_SIZE_MB = 8;

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("El archivo tiene que ser una imagen");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`La imagen no puede pesar más de ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError("Falta configurar Cloudinary (ver .env.example)");
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body,
      });
      if (!res.ok) throw new Error("Cloudinary rechazó la imagen");
      const data = await res.json();
      onChange(data.secure_url as string);
    } catch {
      setError("No se pudo subir la imagen, probá de nuevo");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      {label && <p className="mb-1 text-sm text-secondary">{label}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mb-2 aspect-video w-full rounded-md object-cover" />
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md border border-strong px-3 py-2 text-sm disabled:opacity-60"
        >
          {isUploading ? "Subiendo..." : value ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {value && !isUploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-md border border-strong px-3 py-2 text-sm text-secondary"
          >
            Quitar
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[var(--text-danger)]">{error}</p>}
    </div>
  );
}
