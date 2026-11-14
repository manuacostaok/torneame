import "./globals.css";
import { ToastProvider } from "./components/Toast";
import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";
import { InstallAppBanner } from "./components/InstallAppBanner";
import { AppShell } from "./components/AppShell";
import { Providers } from "./providers";

const SITE_URL = process.env.APP_URL ?? "https://torneame.vercel.app";
const SITE_DESCRIPTION =
  "Armá el bracket, cobrá la inscripción y transmití resultados en vivo. Torneos de videojuegos presenciales y online, sin WhatsApp ni planillas.";

export const viewport = {
  themeColor: "#0b0e14",
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Torneame — Tu torneo, sin el quilombo", template: "%s | Torneame" },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Torneame",
    title: "Torneame — Tu torneo, sin el quilombo",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Torneame — Tu torneo, sin el quilombo",
    description: SITE_DESCRIPTION,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Torneame",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <ToastProvider>
            <ServiceWorkerRegister />
            <AppShell>{children}</AppShell>
            <InstallAppBanner />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
