/** @type {import('next').NextConfig} */

// CSP armada a mano, dominio por dominio, según lo que el proyecto usa de
// verdad: fuentes de Google (login/branding), el generador de QR de
// check-in, y cualquier https:// para imágenes porque sponsors/productos
// guardan URLs de imagen libres (no hay forma de saber de antemano en
// qué dominio va a estar el logo que cargue un organizador).
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' https: data:",
  "connect-src 'self' https://api.mercadopago.com",
  "frame-ancestors 'none'", // mismo efecto que X-Frame-Options: DENY, pero es la forma moderna
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            // REPORT-ONLY a propósito: no puedo levantar la app real en
            // este entorno para confirmar que Next.js hidrata bien con
            // script-src 'self' (algunos setups necesitan un nonce para
            // el script de arranque). En este modo el navegador NUNCA
            // bloquea nada, solo lo reportaría en la consola — así no
            // hay riesgo de romper el sitio en producción por una regla
            // que no pude verificar. Ver DEPLOY.md para el paso de
            // pasarla a bloqueante una vez confirmada.
            key: "Content-Security-Policy-Report-Only",
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
