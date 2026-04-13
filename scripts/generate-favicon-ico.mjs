import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

// Generate ICO from the PWA icon PNG
// ICO format: header + entries + image data
async function generateIco() {
  const sizes = [16, 32, 48];
  const images = [];

  for (const size of sizes) {
    const buf = await sharp(resolve(publicDir, 'pwa-192x192.png'))
      .resize(size, size, { fit: 'contain', background: { r: 10, g: 10, b: 15, alpha: 1 } })
      .png()
      .toBuffer();
    images.push({ size, data: buf });
  }

  // ICO file format
  const headerSize = 6;
  const entrySize = 16;
  let dataOffset = headerSize + entrySize * images.length;
  const entries = [];
  const dataBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0); // width
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1); // height
    entry.writeUInt8(0, 2);  // color palette
    entry.writeUInt8(0, 3);  // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // size
    entry.writeUInt32LE(dataOffset, 12); // offset
    entries.push(entry);
    dataBuffers.push(img.data);
    dataOffset += img.data.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // ICO type
  header.writeUInt16LE(images.length, 4); // image count

  const ico = Buffer.concat([header, ...entries, ...dataBuffers]);
  const outPath = resolve(publicDir, 'favicon.ico');
  writeFileSync(outPath, ico);
  console.log(`✅ favicon.ico generated (${ico.length} bytes, ${sizes.join('+')}px)`);
}

generateIco().catch(console.error);
