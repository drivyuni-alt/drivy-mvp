import { Inter } from "next/font/google";
import type { Metadata } from "next";

import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drivy — Carpooling universitario",
  description:
    "Comparte trayectos con estudiantes de tu universidad. Matching por IA, rutas inteligentes y viajes más baratos.",
};

// Sets the `dark` class before hydration, based on the persisted Zustand theme store
// (see src/store/theme-store.ts), so there is no flash of the wrong theme on load.
const themeInitScript = `
(function () {
  try {
    var raw = localStorage.getItem("drivy-theme");
    var theme = raw ? JSON.parse(raw).state.theme : "system";
    var isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
