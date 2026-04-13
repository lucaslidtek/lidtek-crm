import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

// Source icon - user provided app icon
const sourceIcon = resolve(root, 'source-icon.png');
// Source OG image
const sourceOG = resolve(root, 'source-og.png');

const sizes = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'maskable-icon-512x512.png', size: 512 },
];

async function generate() {
  console.log('Generating PWA icons...');

  for (const { name, size } of sizes) {
    const output = resolve(publicDir, name);

    if (name.startsWith('maskable')) {
      // Maskable icon: add padding (safe area)
      await sharp(sourceIcon)
        .resize(Math.round(size * 0.8), Math.round(size * 0.8), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .extend({
          top: Math.round(size * 0.1),
          bottom: Math.round(size * 0.1),
          left: Math.round(size * 0.1),
          right: Math.round(size * 0.1),
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .png()
        .toFile(output);
    } else {
      await sharp(sourceIcon)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .png()
        .toFile(output);
    }

    console.log(`  ✅ ${name} (${size}x${size})`);
  }

  // OG Image - resize to standard 1200x630
  console.log('Generating OG image...');
  await sharp(sourceOG)
    .resize(1200, 630, { fit: 'cover' })
    .png()
    .toFile(resolve(publicDir, 'og-image.png'));
  console.log('  ✅ og-image.png (1200x630)');

  // Favicon 32x32
  await sharp(sourceIcon)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(resolve(publicDir, 'favicon-32x32.png'));
  console.log('  ✅ favicon-32x32.png (32x32)');

  // Favicon 16x16
  await sharp(sourceIcon)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(resolve(publicDir, 'favicon-16x16.png'));
  console.log('  ✅ favicon-16x16.png (16x16)');

  console.log('\n🎉 All PWA icons generated successfully!');
}

generate().catch(console.error);
