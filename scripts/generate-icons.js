// Node.js script to generate valid PNG icons for PWA compliance using built-in zlib & fs
import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r = 15, g = 23, b = 42) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(2, 9); // color type 2 (RGB)
  ihdrData.writeUInt8(0, 10); // compression method 0
  ihdrData.writeUInt8(0, 11); // filter method 0
  ihdrData.writeUInt8(0, 12); // interlace method 0

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with 0 filter byte per scanline
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowLength;
    rawData[rowStart] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Render eagle theme colors
      if (dist < radius * 0.3) {
        // Center golden shield
        rawData[pixelStart] = 251; // R
        rawData[pixelStart + 1] = 191; // G
        rawData[pixelStart + 2] = 36; // B
      } else if (dist < radius * 0.7) {
        // Eagle blue crest
        rawData[pixelStart] = 37;
        rawData[pixelStart + 1] = 99;
        rawData[pixelStart + 2] = 235;
      } else if (dist < radius) {
        // Outer royal blue
        rawData[pixelStart] = 30;
        rawData[pixelStart + 1] = 58;
        rawData[pixelStart + 2] = 138;
      } else {
        // Deep background #0f172a
        rawData[pixelStart] = r;
        rawData[pixelStart + 1] = g;
        rawData[pixelStart + 2] = b;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC32 table & calculator
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180));
fs.writeFileSync('public/favicon.ico', createPNG(32, 32));

console.log('PWA icon assets generated successfully!');
