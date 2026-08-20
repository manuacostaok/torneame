"use server";

import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Firma una subida puntual — el navegador sube el archivo directo a
 * Cloudinary (nunca pasa por nuestro servidor, evita el límite de tamaño
 * de body de las funciones serverless), pero necesita esta firma para que
 * Cloudinary confirme que la subida la autorizamos nosotros y no
 * cualquiera que se consiga el cloud name. El API secret nunca sale del
 * servidor — solo la firma (un hash, no reversible) y el timestamp.
 */
export async function getCloudinaryUploadSignature() {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para subir una imagen");

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
