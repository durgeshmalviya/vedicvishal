import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/NavBar";

export const metadata: Metadata = {
  title: {
    default: "AstroKundli — Free Vedic Janam Kundli Online",
    template: "%s · AstroKundli",
  },
  description:
    "Generate accurate Janam Kundli with North-Indian charts, D1–D60 Vargas, Vimshottari Dasha, and KP. Powered by Swiss Ephemeris.",
  applicationName: "AstroKundli",
  keywords: [
    "kundli",
    "janam kundli",
    "vedic astrology",
    "navamsa",
    "dasha",
    "birth chart",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Navbar/>{children}</body>
    </html>
  );
}
