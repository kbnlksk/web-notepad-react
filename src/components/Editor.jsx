import { useState } from "react";
import { formatDate } from "../utils/noteHelpers";

export default function Editor({
  note,
  saveStatus,
  onToggleSidebar,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
  onTogglePin,
  onDeleteNote,
  onDownloadNote,
  onCreateNote,
}) {
  const [tagInput, setTagInput] = useState("");

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) {
        onAddTag(tagInput);
        setTagInput("");
      }
    }
  };

  return (
    <main className="editor-area">
      <header className="editor-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="icon-btn mobile-only"
            onClick={onToggleSidebar}
            title="목록 열기/닫기"
            aria-label="목록 열기/닫기"
          >
            ☰
          </button>
          <span className="save-status">{note ? saveStatus : ""}</span>
        </div>

        {note && (
          <div className="toolbar-right">
            <span className="char-count">{note.body.length}자</span>
            <button
              type="button"
              className="ghost-btn"
              onClick={onDownloadNote}
              title=".txt 파일로 다운로드"
            >
              ⬇️ .txt
            </button>
            <button
              type="button"
              className={`ghost-btn${note.pinned ? " pinned" : ""}`}
              onClick={onTogglePin}
              title="상단 고정"
            >
              {note.pinned ? "📌 고정됨" : "📌 고정"}
            </button>
            <button
              type="button"
              className="ghost-btn danger"
              onClick={onDeleteNote}
              title="메모 삭제"
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </header>

      {note ? (
        <section className="editor-content">
          <input
            type="text"
            className="note-title-input"
            value={note.title}
            onChange={(e) => onUpdateNote({ title: e.target.value })}
            placeholder="제목을 입력하세요"
            aria-label="메모 제목"
          />
          <div className="note-meta">
            마지막 수정: {formatDate(note.updatedAt)}
          </div>

          <div className="tag-editor">
            <div className="tag-list">
              {(note.tags || []).map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button
                    type="button"
                    className="tag-remove-btn"
                    title={`${tag} 삭제`}
                    onClick={() => onRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="#태그 입력 후 Enter (예: 업무, 아이디어)"
              aria-label="태그 추가"
            />
          </div>

          <textarea
            className="note-body-input"
            value={note.body}
            onChange={(e) => onUpdateNote({ body: e.target.value })}
            placeholder="여기에 자유롭게 메모를 작성하세요..."
            aria-label="메모 내용"
          />
        </section>
      ) : (
        <section className="empty-state">
          <div className="empty-icon">✍️</div>
          <h2>선택된 메모가 없습니다</h2>
          <p>왼쪽 목록에서 메모를 선택하거나 새 메모를 만들어 보세요.</p>
          <button
            type="button"
            className="primary-btn"
            onClick={onCreateNote}
          >
            + 첫 메모 작성하기
          </button>
        </section>
      )}
    </main>
  );
}
