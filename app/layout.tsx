import "./globals.css";
import { ToastProvider } from "./components/Toast";
import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";
import { InstallAppBanner } from "./components/InstallAppBanner";
import { AppShell } from "./components/AppShell";
import { Providers } from "./providers";

export const metadata = {
  title: "Torneame",
  description: "Tu torneo, sin el quilombo.",
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
