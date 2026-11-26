import { supabase } from "../lib/supabase";

export const FALLBACK_BUCKET = "note-images";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 업로드 전 브라우저에서 이미지를 리사이징·압축해 저장소 용량을 절약합니다.
 */
export async function compressImage(file, maxWidth = 1600, quality = 0.82) {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.size < 180 * 1024
  ) {
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
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".webp"),
            { type: "image/webp" }
          );
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

async function tryUploadToR2(file) {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) return null;

  let res;
  try {
    res = await fetch("/api/r2-presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });
  } catch {
    return null;
  }

  // R2가 아직 미설정(501)이거나 로컬 Vite 개발 서버(404)인 경우 Supabase Storage로 폴백
  if (res.status === 404 || res.status === 501) {
    return null;
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.uploadUrl) {
    throw new Error(payload.error || "R2 업로드 URL 생성에 실패했습니다.");
  }

  const putRes = await fetch(payload.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Cloudflare R2 업로드 실패 (HTTP ${putRes.status})`);
  }

  return {
    url: payload.publicUrl,
    storage: "r2",
  };
}

/**
 * 이미지 또는 일반 파일(PDF 등)을 R2(우선) 또는 Supabase Storage에 업로드합니다.
 */
export async function uploadNoteFile(file, userId) {
  if (!supabase || !userId) {
    throw new Error("로그인 상태를 확인할 수 없습니다.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("파일 크기는 50MB 이하만 첨부할 수 있습니다.");
  }

  const isImage = file.type.startsWith("image/");
  const processedFile = isImage ? await compressImage(file) : file;

  // 1. Cloudflare R2 업로드 시도
  const r2Result = await tryUploadToR2(processedFile);
  if (r2Result) {
    return {
      name: file.name,
      url: r2Result.url,
      size: processedFile.size,
      type: processedFile.type || "application/octet-stream",
      storage: "r2",
    };
  }

  // 2. 폴백: Supabase Storage 업로드
  const ext = processedFile.name.split(".").pop()?.toLowerCase() || "bin";
  const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(FALLBACK_BUCKET)
    .upload(filePath, processedFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: processedFile.type || "application/octet-stream",
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(FALLBACK_BUCKET).getPublicUrl(filePath);
  return {
    name: file.name,
    url: data.publicUrl,
    size: processedFile.size,
    type: processedFile.type || "application/octet-stream",
    storage: "supabase",
  };
}

export async function uploadNoteImage(file, userId) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 첨부할 수 있습니다.");
  }
  const uploaded = await uploadNoteFile(file, userId);
  return uploaded.url;
}
