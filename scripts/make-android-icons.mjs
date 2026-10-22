import sharp from "sharp";

const RES = "android/app/src/main/res";
const BG = "#1b1e27";
const MINT = "#5cc4a4";

const mark = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)" fill="none" stroke="${MINT}" stroke-linecap="round">
    <circle cx="256" cy="256" r="118" stroke-width="30"/>
    <path d="M256 64v62M256 386v62M64 256h62M386 256h62" stroke-width="30"/>
    <circle cx="256" cy="256" r="34" fill="${MINT}" stroke="none"/>
  </g>`;
const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${inner}</svg>`;

const legacy = wrap(`<rect width="512" height="512" rx="112" fill="${BG}"/>${mark(1)}`);
const round = wrap(`<circle cx="256" cy="256" r="256" fill="${BG}"/>${mark(0.85)}`);
// Adaptive foreground: transparent, mark kept inside the central 66% safe zone.
const foreground = wrap(mark(0.62));

const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const dir = `${RES}/mipmap-${d}`;
  await sharp(Buffer.from(legacy)).resize(Math.round(48 * k)).png().toFile(`${dir}/ic_launcher.png`);
  await sharp(Buffer.from(round)).resize(Math.round(48 * k)).png().toFile(`${dir}/ic_launcher_round.png`);
  await sharp(Buffer.from(foreground)).resize(Math.round(108 * k)).png().toFile(`${dir}/ic_launcher_foreground.png`);
}
console.log("android icons written");
