import QRCode from "qrcode";

/**
 * Generates ISO/IEC 18004 standard QR Code matrix using official Reed-Solomon error correction.
 * Returns a 2D boolean grid (true = dark cell, false = light cell) for SVG/Canvas rendering.
 */
export function generateQrMatrix(text: string): boolean[][] {
  if (!text) {
    return Array.from({ length: 21 }, () => Array.from({ length: 21 }, () => false));
  }

  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const size = qr.modules.size;
    const data = qr.modules.data;

    const matrix: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        const isDark = Boolean(data[r * size + c]);
        row.push(isDark);
      }
      matrix.push(row);
    }
    return matrix;
  } catch {
    return Array.from({ length: 21 }, () => Array.from({ length: 21 }, () => false));
  }
}
