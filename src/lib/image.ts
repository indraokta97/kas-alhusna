/**
 * Foto nota dikompres di perangkat sebelum disimpan: localStorage hanya
 * menyediakan sekitar 5 MB, jadi foto kamera 4 MB tidak boleh masuk apa adanya.
 */
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 1200;
const TARGET_CHARS = 700_000;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Foto tidak bisa dibaca. Coba format JPG atau PNG."));
    image.src = url;
  });
}

function draw(image: HTMLImageElement, maxEdge: number): string | null {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export async function fileToReceipt(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Pilih berkas gambar (JPG atau PNG).");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Ukuran foto maksimal 12 MB.");
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    let dataUrl = draw(image, MAX_EDGE);
    if (!dataUrl) throw new Error("Foto gagal diproses di perangkat ini.");
    if (dataUrl.length > TARGET_CHARS) dataUrl = draw(image, 900) ?? dataUrl;
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}
