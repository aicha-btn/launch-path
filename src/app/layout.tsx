import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

/* Trois familles, trois rôles exclusifs — voir docs/design-system.md § 4.
   Archivo : toute l'interface.
   Instrument Serif : titres d'affichage uniquement, jamais sous 28 px.
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
