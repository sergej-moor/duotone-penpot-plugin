interface ProcessedImage {
  data: Uint8Array;
  width: number;
  height: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const fullHex = hex.replace('#', '');
  const bigint = parseInt(fullHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export async function processImage(
  imageData: Uint8Array,
  width: number,
  height: number,
  color1: string,
  color2: string
): Promise<ProcessedImage> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  // Create and draw original image
  const blob = new Blob([imageData], { type: 'image/png' });
  const imageBitmap = await createImageBitmap(blob);
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Get image data for processing
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  // Apply duotone effect
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    const t = gray / 255;

    data[i] = (1 - t) * c1.r + t * c2.r; // R
    data[i + 1] = (1 - t) * c1.g + t * c2.g; // G
    data[i + 2] = (1 - t) * c1.b + t * c2.b; // B
    // alpha remains unchanged
  }

  ctx.putImageData(imgData, 0, 0);

  // Get processed data
  const processedBlob = await canvasToBlob(canvas);
  const processedData = new Uint8Array(await processedBlob.arrayBuffer());

  return { data: processedData, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  );
}
