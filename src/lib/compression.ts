const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.7;
const MAX_SIZE_BYTES = 500 * 1024; // 500KB

// base64 dataURL 的实际字节数（不是字符串长度）
function dataUrlBytes(dataUrl: string): number {
  const m = dataUrl.match(/^data:.*;base64,(.*)$/);
  if (!m) return dataUrl.length;
  const b64 = m[1];
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, width, height);

        // Try with quality; iteratively reduce if still too large
        let quality = JPEG_QUALITY;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (dataUrlBytes(result) > MAX_SIZE_BYTES && quality > 0.2) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percent: number;
}> {
  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
    percent: estimate.quota ? Math.round(((estimate.usage ?? 0) / estimate.quota) * 100) : 0,
  };
}
