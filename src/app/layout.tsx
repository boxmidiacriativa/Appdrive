import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const appFont = Manrope({
  variable: "--font-app",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reserve seu motorista",
  description: "Motorista particular com hora marcada: transfer, viagens e motorista por período.",
  appleWebApp: { capable: true, title: "Motorista", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#12192b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${appFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
