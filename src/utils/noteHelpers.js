export const THEME_STORAGE_KEY = "vibe_notepad_react_theme_v1";

export const SGF_CATEGORIES = [
  {
    id: "COMPANY",
    label: "COMPANY",
    sub: "기업·경영",
    children: ["기업소개", "비전", "연혁", "오시는길"],
  },
  {
    id: "BUSINESS",
    label: "BUSINESS",
    sub: "사업·유통",
    children: ["외식사업", "가맹사업", "육가공 · 유통사업", "식품제조 · 가공사업"],
  },
  {
    id: "BRAND",
    label: "BRAND",
    sub: "브랜드·매장",
    children: [
      "달맞이광장바베큐",
      "산청숯불가든",
      "석암생소금구이",
      "세광양대창",
      "교대이층집",
      "오목집",
      "교대갈비집",
    ],
  },
  {
    id: "FRANCHISE",
    label: "FRANCHISE",
    sub: "가맹·창업",
    children: ["브랜드 소개", "창업 절차", "창업 문의"],
  },
  {
    id: "COMMUNITY",
    label: "COMMUNITY",
    sub: "공지·소통",
    children: ["공지사항", "고객의 소리", "매장 찾기"],
  },
];

export function parseCategory(raw) {
  if (!raw) return { main: "COMMUNITY", sub: "" };
  const [main, sub = ""] = String(raw).split("::");
  return { main: main || "COMMUNITY", sub };
}

export function formatCategoryValue(main, sub = "") {
  const safeMain = main || "COMMUNITY";
  return sub ? `${safeMain}::${sub}` : safeMain;
}

export function getCategoryMeta(categoryId) {
  const { main } = parseCategory(categoryId);
  return (
    SGF_CATEGORIES.find((c) => c.id === main) ||
    SGF_CATEGORIES[SGF_CATEGORIES.length - 1]
  );
}

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
