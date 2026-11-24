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

export function createWelcomeNotePayload() {
  return {
    title: "클라우드 동기화 웹 메모장에 오신 것을 환영합니다",
    body: [
      "이제 작성한 메모가 Supabase 클라우드에 자동 저장됩니다.",
      "",
      "• PC와 스마트폰에서 같은 계정으로 로그인하면 메모가 동기화됩니다.",
      "• 오른쪽 위 🌙 버튼을 눌러 다크 모드를 켜고 끌 수 있습니다.",
      "• 아래 태그 입력창에 #업무, #아이디어 같은 태그를 추가해 보세요.",
      "• 상단 ⬇️ .txt 버튼으로 현재 메모를 텍스트 파일로 내려받을 수 있습니다.",
    ].join("\n"),
    tags: ["#안내", "#클라우드"],
    pinned: true,
  };
}
