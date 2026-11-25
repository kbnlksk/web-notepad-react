import { supabase } from "../lib/supabase";

export const IMAGE_BUCKET = "note-images";

/**
 * 업로드 전 브라우저에서 이미지를 리사이징·압축해 저장소 용량을 절약합니다.
 */
export async function compressImage(file, maxWidth = 1600, quality = 0.82) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 180 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
          });
          resolve(compressed);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export async function uploadNoteImage(file, userId) {
  if (!supabase || !userId) {
    throw new Error("로그인 상태를 확인할 수 없습니다.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 첨부할 수 있습니다.");
  }

  const processedFile = await compressImage(file);
  const ext = processedFile.name.split(".").pop()?.toLowerCase() || "webp";
  const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, processedFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: processedFile.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
