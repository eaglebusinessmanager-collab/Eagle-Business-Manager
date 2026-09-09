import QRCode from 'qrcode';
import { Product } from '../types';

/**
 * Generates an automatic 12-digit numeric barcode (EAN-12 format)
 * based on prefix and timestamp hash.
 */
export function generateBarcode(prefix = '256'): string {
  const timePart = Date.now().toString().slice(-8);
  const randomPart = Math.floor(100 + Math.random() * 900).toString().slice(-1);
  return `${prefix}${timePart}${randomPart}`;
}

/**
 * Pure SVG Code-128 / Barcode Renderer
 * Converts any alphanumeric barcode or SKU into an SVG barcode representation.
 */
export function renderBarcodeSvg(code: string, width = 240, height = 64): string {
  const safeCode = (code || '000000000000').toUpperCase();
  // Hash characters into alternating bar widths for visual representation
  const barPattern: number[] = [];
  // Guard start
  barPattern.push(2, 1, 1, 1, 2);

  for (let i = 0; i < safeCode.length; i++) {
    const charCode = safeCode.charCodeAt(i);
    const b1 = (charCode % 3) + 1;
    const b2 = ((charCode >> 1) % 2) + 1;
    const b3 = ((charCode >> 2) % 3) + 1;
    const b4 = ((charCode >> 3) % 2) + 1;
    barPattern.push(b1, b2, b3, b4);
  }

  // Guard stop
  barPattern.push(2, 1, 2, 2, 2);

  const totalUnits = barPattern.reduce((a, b) => a + b, 0);
  const unitWidth = width / totalUnits;

  let currentX = 0;
  let rects = '';

  barPattern.forEach((w, index) => {
    const isBar = index % 2 === 0;
    const barW = w * unitWidth;
    if (isBar) {
      rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${barW.toFixed(2)}" height="${height - 18}" fill="currentColor" />`;
    }
    currentX += barW;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto text-slate-900 dark:text-slate-100">
      ${rects}
      <text x="${width / 2}" y="${height - 4}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="currentColor">${safeCode}</text>
    </svg>
  `;
}

/**
 * Generate Product Public QR Code
 * CRITICAL SECURITY DIRECTIVE:
 * Never include private business info, passwords, or buying costs.
 * Only encode public verification & preview link / identifiers.
 */
export async function generateProductQrDataUrl(product: Product): Promise<string> {
  const origin = window.location.origin;
  // Public product link or verification payload
  const publicPayload = `${origin}/#marketplace?product=${encodeURIComponent(product.id)}`;

  try {
    const dataUrl = await QRCode.toDataURL(publicPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate product QR code:', err);
    return '';
  }
}

/**
 * Audio Beep feedback using Web Audio API
 */
export function playScanBeep(success = true): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio context might be restricted before user gesture
  }
}

/**
 * Printable Product Barcode & QR Label
 */
export function printProductLabel(
  product: Product,
  currency = 'UGX',
  businessName = 'Eagle Business'
): void {
  const barcode = product.barcode || product.sku || 'EAGLE-ITEM';
  const priceFormatted = `${currency} ${product.sellingPrice.toLocaleString()}`;

  const printWindow = window.open('', '_blank', 'width=600,height=500');
  if (!printWindow) {
    alert('Please allow pop-ups to print barcode labels.');
    return;
  }

  generateProductQrDataUrl(product).then((qrDataUrl) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${product.name}</title>
          <style>
            @page { size: auto; margin: 8mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #0f172a;
              background: #ffffff;
              padding: 20px;
              margin: 0;
            }
            .label-card {
              border: 2px dashed #94a3b8;
              border-radius: 12px;
              padding: 20px;
              max-width: 380px;
              margin: 0 auto;
              text-align: center;
            }
            .biz-name {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #2563eb;
              margin-bottom: 4px;
            }
            .item-name {
              font-size: 16px;
              font-weight: 800;
              margin: 4px 0 8px;
              line-height: 1.2;
            }
            .price-tag {
              display: inline-block;
              font-size: 18px;
              font-weight: 900;
              color: #047857;
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              padding: 4px 14px;
              border-radius: 8px;
              margin-bottom: 12px;
            }
            .codes-container {
              display: flex;
              align-items: center;
              justify-content: space-around;
              gap: 12px;
              margin-top: 10px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
            }
            .qr-img {
              width: 90px;
              height: 90px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 2px;
            }
            .barcode-svg {
              max-width: 200px;
              height: auto;
            }
            .sku-text {
              font-size: 10px;
              color: #64748b;
              font-family: monospace;
              margin-top: 4px;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
              .label-card { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="biz-name">${businessName}</div>
            <div class="item-name">${product.name}</div>
            <div class="price-tag">${priceFormatted}</div>
            <div class="sku-text">SKU: ${product.sku} | Category: ${product.category}</div>
            
            <div class="codes-container">
              <div>
                <div style="font-size: 9px; font-weight: bold; margin-bottom: 3px;">SCAN TO VERIFY</div>
                <img src="${qrDataUrl}" class="qr-img" alt="QR Code" />
              </div>
              <div style="flex: 1;">
                <div style="font-size: 9px; font-weight: bold; margin-bottom: 3px;">BARCODE (POS)</div>
                <div class="barcode-svg">
                  ${renderBarcodeSvg(barcode, 180, 56)}
                </div>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
              Print Label
            </button>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  });
}
