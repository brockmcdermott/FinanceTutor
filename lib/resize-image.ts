/**
 * Client-side image resize using Canvas API (no WASM; works with Turbopack).
 * Use only from client code (e.g. hooks). Resizes to fit within maxWidth x maxHeight (aspect ratio preserved).
 * SVG is returned unchanged. Output format is JPEG for smaller file size.
 */

const DEFAULT_MAX_SIZE = 512;

export type ResizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
};

/**
 * Resizes an image file to fit within max dimensions. Returns a new File (JPEG) or the original if SVG or already small.
 */
export async function resizeImage(
  file: File,
  options: ResizeImageOptions = {}
): Promise<File> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_SIZE;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_SIZE;

  if (file.type === "image/svg+xml") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;

  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  if (scale >= 1) {
    bitmap.close();
    return file;
  }

  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(targetWidth, targetHeight)
      : Object.assign(document.createElement("canvas"), {
          width: targetWidth,
          height: targetHeight,
        }) as HTMLCanvasElement;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  (ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    if ("toBlob" in canvas) {
      (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), "image/jpeg", 0.9);
    } else if ("convertToBlob" in canvas) {
      (canvas as OffscreenCanvas)
        .convertToBlob({ type: "image/jpeg", quality: 0.9 })
        .then(resolve);
    } else {
      resolve(null);
    }
  });

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
