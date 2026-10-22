import sharp from "sharp";
import { writeFileSync } from "node:fs";

const BG = "#1b1e27";
const MINT = "#5cc4a4";

// Target mark: ring + four ticks + centre dot. `scale` shrinks it for the maskable safe zone.
const mark = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)" fill="none" stroke="${MINT}" stroke-linecap="round">
    <circle cx="256" cy="256" r="118" stroke-width="30"/>
    <path d="M256 64v62M256 386v62M64 256h62M386 256h62" stroke-width="30"/>
    <circle cx="256" cy="256" r="34" fill="${MINT}" stroke="none"/>
  </g>`;

const svg = (scale, rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ""} fill="${BG}"/>${mark(scale)}
</svg>`;

const out = async (name, size, scale, rounded) =>
  sharp(Buffer.from(svg(scale, rounded))).resize(size, size).png().toFile(`public/icons/${name}`);

await out("icon-192.png", 192, 1, true);
await out("icon-512.png", 512, 1, true);
await out("maskable-512.png", 512, 0.72, false); // full-bleed, mark inside the safe zone
await out("apple-touch-icon.png", 180, 0.9, false);
writeFileSync("app/icon.svg", svg(1, true));
console.log("icons written");
