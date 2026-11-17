// Génère toutes les icônes PWA à partir de votre vrai logo.
// Usage : npm i -D sharp && node scripts/generate-icons.mjs public/images/logo.png
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const src = process.argv[2] || "public/images/logo.png";
const bg = { r: 10, g: 10, b: 10, alpha: 1 }; // #0a0a0a
mkdirSync("public/icons", { recursive: true });

const make = async (size, file, ratio) => {
  const inner = Math.round(size * ratio);
  const logo = await sharp(src).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`public/icons/${file}`);
  console.log("✔", file);
};

await make(192, "icon-192.png", 0.8);
await make(512, "icon-512.png", 0.8);
await make(512, "maskable-512.png", 0.6); // marge de sécurité 80 % pour le masque Android
await make(180, "apple-touch-icon.png", 0.8);
