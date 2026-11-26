import { useState } from "react";
import BrandLogo from "./BrandLogo";
import { formatDate, normalizeEditorContent, stripHtml } from "../utils/noteHelpers";
import { copyTextToClipboard } from "../utils/shareNote";

export default function SharedNoteView({ note, isDark, onToggleTheme, onExit }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${note.title || "제목 없음"}\n\n${stripHtml(note.body)}`;
    await copyTextToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="shared-page">
      <header className="shared-header">
        <BrandLogo showSubtitle />
        <div className="toolbar-right">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button type="button" className="ghost-btn" onClick={handleCopy}>
            {copied ? "✅ 복사됨" : "📋 본문 복사"}
          </button>
          <button type="button" className="primary-btn" onClick={onExit}>
            내 메모장으로
          </button>
        </div>
      </header>

      <article className="shared-card">
        <div className="shared-badge">공유된 메모 (읽기 전용)</div>
        <h1 className="shared-title">{note.title || "제목 없음"}</h1>
        <div className="note-meta">
          수정일: {formatDate(note.updatedAt)}
        </div>
        {(note.tags || []).length > 0 && (
          <div className="tag-list" style={{ marginBottom: "18px" }}>
            {note.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div
          className="tiptap-prose"
          dangerouslySetInnerHTML={{
            __html: normalizeEditorContent(note.body || ""),
          }}
        />
      </article>
    </div>
  );
}
