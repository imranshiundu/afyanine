import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AfyaNine — Nine months. One journey.",
    short_name: "AfyaNine",
    description:
      "AfyaNine connects expectant mothers and Community Health Workers in Kenya with antenatal care scheduling, wearable vitals monitoring and 24/7 emergency response.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF7",
    theme_color: "#FAFAF7",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
