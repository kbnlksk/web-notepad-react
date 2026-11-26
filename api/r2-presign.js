import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    return res.status(501).json({
      configured: false,
      error: "Cloudflare R2 환경 변수가 아직 설정되지 않았습니다.",
    });
  }

  // 로그인한 사용자 확인 (Supabase JWT 검증)
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ error: "인증 토큰이 필요합니다." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase 서버 환경 변수가 누락되었습니다." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return res.status(401).json({ error: "유효하지 않은 로그인 세션입니다." });
  }

  const { fileName = "file", contentType = "application/octet-stream" } = req.body || {};
  const safeName = String(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-60);
  const key = `${authData.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 120 });
  const publicUrl = `${publicBaseUrl}/${key}`;

  return res.status(200).json({
    configured: true,
    uploadUrl,
    publicUrl,
    key,
  });
}
