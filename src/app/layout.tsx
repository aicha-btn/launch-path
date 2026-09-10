import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

/* Typographie LaunchPath — voir docs/design-system.md § 3.
   Archivo : toute l'interface.
   Instrument Serif : accent d'affichage exceptionnel.
   IBM Plex Mono : libellés, dates, compteurs, identifiants. */

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LaunchPath",
  description:
    "Créez des parcours d'onboarding réutilisables, lancez-les, suivez l'avancement et les retards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${archivo.variable} ${instrumentSerif.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
