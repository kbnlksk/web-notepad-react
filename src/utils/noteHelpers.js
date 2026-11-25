export const THEME_STORAGE_KEY = "vibe_notepad_react_theme_v1";

export function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeTag(raw) {
  const cleaned = raw.trim().replace(/^#+/, "").replace(/\s+/g, "_");
  return cleaned ? `#${cleaned}` : "";
}

export function stripHtml(html) {
  if (!html) return "";
  if (!/[<>]/.test(html)) return html;

  const doc = new DOMParser().parseFromString(
    html
      .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n"),
    "text/html"
  );
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

export function normalizeEditorContent(rawBody) {
  if (!rawBody) return "";
  if (/<(p|div|h[1-6]|ul|ol|blockquote|img|strong|em|u|s|span)\b/i.test(rawBody)) {
    return rawBody;
  }
  return rawBody
    .split("\n")
    .map((line) => `<p>${line ? escapeHtml(line) : "<br>"}</p>`)
    .join("");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function createWelcomeNotePayload() {
  return {
    title: "클라우드 동기화 웹 메모장에 오신 것을 환영합니다",
    body: [
      "<p>이제 작성한 메모가 <strong>Supabase 클라우드</strong>에 자동 저장됩니다.</p>",
      "<ul>",
      "<li><p>상단 툴바에서 <strong>글씨체</strong>, <strong>굵게</strong>, <u>밑줄</u>, <em>기울임</em> 등 서식을 바꿀 수 있습니다.</p></li>",
      "<li><p><strong>🖼️ 사진</strong> 버튼(또는 이미지 붙여넣기)으로 사진을 자동 압축해 첨부할 수 있습니다.</p></li>",
      "<li><p>PC와 스마트폰에서 같은 계정으로 로그인하면 메모가 동기화됩니다.</p></li>",
      "</ul>",
    ].join(""),
    tags: ["#안내", "#클라우드"],
    pinned: true,
  };
}
