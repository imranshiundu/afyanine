import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
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
  appleWebApp: { capable: true, title: "AfyaNine", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  other: { "apple-mobile-web-app-capable": "yes" },
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

/* Applies the saved theme before first paint so there is no flash. */
const THEME_INIT = `try{var t=localStorage.getItem("afyanine-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className={`${inter.variable}`}>{children}</body>
    </html>
  );
}
