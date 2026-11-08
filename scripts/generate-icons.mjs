/**
 * Rasterizes the PWA icon set from the SVG sources in public/icons/.
 * Run: node scripts/generate-icons.mjs
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const VIEWBOX = 64;

async function render(source, size, output) {
  await sharp(source, { density: (72 * size) / VIEWBOX })
    .resize(size, size)
    .png()
    .toFile(output);
}

await mkdir("public/icons", { recursive: true });

await render("public/icons/icon.svg", 192, "public/icons/icon-192.png");
await render("public/icons/icon.svg", 512, "public/icons/icon-512.png");
await render("public/icons/maskable.svg", 512, "public/icons/maskable-512.png");
/* iOS home-screen icons must be full-bleed squares — the OS applies its own mask */
await render("public/icons/maskable.svg", 180, "public/icons/apple-touch-icon.png");

console.log("PWA icons written to public/icons/");
