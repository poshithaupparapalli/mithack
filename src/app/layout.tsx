import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { FamilyProvider } from "@/lib/family-context";
import { SettingsProvider } from "@/lib/settings-context";
import { PersonaSwitch } from "@/components/persona-switch";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Keepsake — your family, remembered",
  description:
    "Capture the stories your family has never written down. Speak, and Keepsake does the rest.",
};

export const viewport: Viewport = {
  themeColor: "#faf6ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  /* Elders pinch-zoom. Never disable it. */
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">
        <SettingsProvider>
          <FamilyProvider>
            {children}
            <PersonaSwitch />
          </FamilyProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
