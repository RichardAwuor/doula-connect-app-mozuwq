import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { renameSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconPath = join(__dirname, '../assets/images/2c49644d-ff43-4443-abf4-4161941a1027.png');
const tmpPath = iconPath + '.tmp.png';

await sharp(iconPath)
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .resize(1024, 1024, { fit: 'cover' })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(tmpPath);

renameSync(tmpPath, iconPath);

console.log('Done: icon saved as 1024x1024 RGB PNG with no alpha channel.');
