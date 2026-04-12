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
  metadataBase: new URL("https://resforge.tapan.pro/"),
  title: {
    default: "ResumeForge | AI-Powered Resume Builder & ATS Scorer",
    template: "%s | ResumeForge",
  },
  description:
    "Forge your career with ResumeForge. AI-powered resume editor that scores, tailors, and perfects your resume for every role with pixel-perfect PDF exports.",
  keywords: [
    "AI Resume Builder",
    "ATS Resume Scorer",
    "Resume Tailoring",
    "ResumeForge",
    "Professional Resume Templates",
    "Career Tool",
  ],
  authors: [{ name: "ResumeForge Team" }],
  creator: "ResumeForge",
  publisher: "ResumeForge",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://resforge.tapan.pro/",
    siteName: "ResumeForge",
    title: "ResumeForge | AI-Powered Resume Builder",
    description:
      "Stop writing resumes. Start forging careers. The AI-powered resume editor that scores, tailors, and perfects your resume for every role.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ResumeForge Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeForge | AI-Powered Resume Builder",
    description:
      "The AI-powered resume editor that actually handles the ATS for you. Get callbacks faster with tailored content.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
