import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";

// Space Grotesk — geometric, slightly technical display face. Reads as
// "software," not "agency," which fits a product that's explicitly an
// AI employee rather than a marketing gimmick.
export const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

export const fontBody = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Monospace for the live ticker, metrics, and anything that reads as
// "data the system is generating right now."
export const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
