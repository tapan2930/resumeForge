import type { Metadata } from "next";
import {
  Inter,
  IBM_Plex_Serif,
  Lora,
  Playfair_Display,
  Merriweather,
  Cinzel,
  Source_Serif_4,
  Crimson_Pro,
  Fraunces,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { HydrateStore } from "@/components/hydrate-store";

/** App UI + editor + Modern template accents (sans-serif, not monospace). */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["600", "700"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const ibmSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-ibm-plex-serif",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ResumeForge",
  description: "AI-powered resume editor with version control and PDF export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lora.variable} ${playfair.variable} ${merriweather.variable} ${cinzel.variable} ${sourceSerif.variable} ${ibmSerif.variable} ${crimson.variable} ${fraunces.variable} font-sans min-h-screen bg-background antialiased`}
      >
        <Providers>
          <HydrateStore />
          {children}
        </Providers>
      </body>
    </html>
  );
}
