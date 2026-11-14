import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Imagen que se ve al compartir el link en WhatsApp, Instagram, Discord, X.
// Con formato 1.91:1 (1200×630) el preview ocupa todo el ancho; el ícono
// cuadrado de 512px quedaba chico y recortado.
export const alt = "Torneame — Tu torneo, sin el quilombo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "icon-512.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#0b0e14",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(124,92,252,0.35), rgba(11,14,20,0) 55%)",
          color: "#f5f6fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={84} height={84} alt="" style={{ borderRadius: 18 }} />
          <div style={{ fontSize: 34, letterSpacing: 6, color: "#a597ff", fontWeight: 700 }}>
            TORNEAME
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Tu torneo,
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              color: "#a597ff",
            }}
          >
            sin el quilombo.
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#8a93a6" }}>
            Brackets automáticos, cobro de inscripción y resultados en vivo.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Presencial y online", "Ranking ELO", "Modo Amigos"].map((chip) => (
            <div
              key={chip}
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                border: "2px solid #2a3140",
                background: "#151a23",
                fontSize: 24,
                color: "#f5f6fa",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
