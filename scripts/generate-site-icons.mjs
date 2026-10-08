import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

// Raster variants are derived from the approved SVG, not independent artwork.
// Supply a local sharp module path when it is provided by a workspace runtime.
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || "sharp");
const assets = path.resolve(import.meta.dirname, "../src/site/assets");
const svg = await fs.readFile(path.join(assets, "favicon.svg"), "utf8");
const rasterSvg = svg.replace(/<style>[\s\S]*?<\/style>/, "")
  .replace('stroke="currentColor"', 'stroke="#353535"')
  .replace(/(<svg[^>]*>)/, '$1<rect width="32" height="32" fill="#fffefa"/>');
const render = (size) => sharp(Buffer.from(rasterSvg), { density: 576 })
  .resize(size, size).png().toBuffer();
await fs.writeFile(path.join(assets, "favicon-32.png"), await render(32));
await fs.writeFile(path.join(assets, "apple-touch-icon.png"), await render(180));
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(render));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((bytes, index) => {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(bytes.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += bytes.length;
});
await fs.writeFile(path.join(assets, "favicon.ico"), Buffer.concat([header, ...images]));
console.log("Generated 32px PNG, 180px Apple touch icon, and 16/32/48px ICO from favicon.svg.");
