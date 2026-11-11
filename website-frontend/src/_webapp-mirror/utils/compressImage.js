// Shrinks a photo to a JPEG data URL small enough to send as JSON
// (work evidence stores the image itself in `fileUrl`; there is no upload service).
const MAX_EDGE = 1280;
const MIN_EDGE = 640;
const TARGET_BYTES = 350 * 1024;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh. Vui lòng chọn file ảnh khác.'));
    };
    img.src = url;
  });

// Data URL length → decoded byte size (base64 is 4 chars per 3 bytes).
export const dataUrlBytes = (dataUrl) => Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

export async function compressImage(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Vui lòng chọn file ảnh.');
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let edge = MAX_EDGE;
  let quality = 0.72;
  let dataUrl = '';
  // Lower quality first, then size, until the image fits the budget.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrlBytes(dataUrl) <= TARGET_BYTES) break;
    if (quality > 0.5) quality -= 0.12;
    else edge = Math.max(MIN_EDGE, Math.round(edge * 0.8));
  }
  return dataUrl;
}

export default compressImage;
