#!/usr/bin/env node
'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconPath = path.join(__dirname, '../assets/images/2c49644d-ff43-4443-abf4-4161941a1027.png');
const tmpPath = iconPath + '.tmp.png';

sharp(iconPath)
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .resize(1024, 1024, { fit: 'cover' })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(tmpPath)
  .then(() => {
    fs.renameSync(tmpPath, iconPath);
    console.log('Done: icon saved as 1024x1024 RGB PNG with no alpha channel.');
  })
  .catch((err) => {
    console.error('Error processing icon:', err);
    process.exit(1);
  });
