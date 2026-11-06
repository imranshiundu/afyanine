import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AfyaNine — Nine months. One journey. Connected care.",
  description:
    "AfyaNine connects expectant mothers and Community Health Workers in Kenya with antenatal care scheduling, wearable vitals monitoring and 24/7 emergency response.",
  applicationName: "AfyaNine",
  keywords: [
    "AfyaNine",
    "maternal health",
    "antenatal care",
    "community health worker",
    "Kenya",
    "emergency response",
  ],
};

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>{children}</body>
    </html>
  );
}
