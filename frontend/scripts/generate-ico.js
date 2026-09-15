const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');
const { Jimp, JimpMime } = require('jimp');

(async () => {
  const img = await Jimp.read(path.join(__dirname, '..', 'public', 'logo.png'));
  const size = 512;
  const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });
  img.contain({ w: size, h: size });
  canvas.composite(img, Math.floor((size - img.bitmap.width) / 2), Math.floor((size - img.bitmap.height) / 2));
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngs = await Promise.all(sizes.map(async (s) => {
    const copy = canvas.clone();
    copy.resize({ w: s, h: s });
    return await copy.getBuffer(JimpMime.png);
  }));
  const ico = await toIco(pngs);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'logo.ico'), ico);
  console.log('ICO gerado com to-ico');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
