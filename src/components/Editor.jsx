import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { FontSize } from "../utils/fontSizeExtension";
import {
  formatDate,
  normalizeEditorContent,
  stripHtml,
} from "../utils/noteHelpers";
import {
  formatFileSize,
  uploadNoteFile,
  uploadNoteImage,
} from "../utils/imageUpload";
import { copyTextToClipboard, encodeSharePayload } from "../utils/shareNote";
import Dashboard from "./Dashboard";

const FONT_OPTIONS = [
  { label: "기본 고딕", value: "" },
  { label: "명조 / 세리프", value: '"Noto Serif KR", "Batang", Georgia, serif' },
  { label: "둥근 스타일", value: '"Jua", "Dongle", "Apple SD Gothic Neo", cursive, sans-serif' },
  { label: "고정폭 (코드)", value: '"Consolas", "Courier New", monospace' },
];

const FONT_SIZE_OPTIONS = [
  { label: "크기 (기본)", value: "" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
  { label: "28px", value: "28px" },
];

const HIGHLIGHT_OPTIONS = [
  { label: "노랑", color: "#fef08a" },
  { label: "민트", color: "#99f6e4" },
  { label: "핑크", color: "#fbcfe8" },
  { label: "하늘", color: "#bae6fd" },
];

export default function Editor({
  note,
  userId,
  saveStatus,
  onToggleSidebar,
  onOpenDashboard,
  onOpenShare,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
  onAddAttachment,
  onRemoveAttachment,
  onTogglePin,
  onDeleteNote,
  onDownloadNote,
  onCreateNote,
}) {
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const activeNoteIdRef = useRef(note?.id ?? null);
  const onUpdateNoteRef = useRef(onUpdateNote);

  onUpdateNoteRef.current = onUpdateNote;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        HTMLAttributes: {
          class: "note-inline-image",
        },
      }),
    ],
    content: normalizeEditorContent(note?.body || ""),
    editorProps: {
      attributes: {
        class: "tiptap-prose",
        "aria-label": "메모 내용",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              handleImageFile(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFile = Array.from(files).find((f) => f.type.startsWith("image/"));
        if (imageFile) {
          event.preventDefault();
          handleImageFile(imageFile);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onUpdateNoteRef.current({ body: ed.getHTML() });
    },
  });

  useEffect(() => {
    setShareMenuOpen(false);
    setShareFeedback("");
  }, [note?.id]);

  useEffect(() => {
    if (!editor) return;
    const nextId = note?.id ?? null;
    const nextHtml = normalizeEditorContent(note?.body || "");

    if (activeNoteIdRef.current !== nextId) {
      activeNoteIdRef.current = nextId;
      editor.commands.setContent(nextHtml, false);
      return;
    }

    if (!editor.isFocused && editor.getHTML() !== nextHtml) {
      editor.commands.setContent(nextHtml, false);
    }
  }, [editor, note?.id, note?.body]);

  const handleImageFile = async (file) => {
    if (!editor || !userId) return;
    setUploadingImage(true);
    try {
      const publicUrl = await uploadNoteImage(file, userId);
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } catch (err) {
      alert(
        `사진 업로드 실패: ${err.message}\n\nSupabase Storage에 'note-images' 버킷이 생성되어 있는지 확인해 주세요.`
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      handleImageFile(file);
    }
  };

  const handleAttachmentChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;

    setUploadingFile(true);
    try {
      const uploaded = await uploadNoteFile(file, userId);
      onAddAttachment(uploaded);
    } catch (err) {
      alert(`파일 첨부 실패: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) {
        onAddTag(tagInput);
        setTagInput("");
      }
    }
  };

  const showShareToast = (msg) => {
    setShareFeedback(msg);
    setShareMenuOpen(false);
    setTimeout(() => setShareFeedback(""), 2500);
  };

  const handleNativeShare = async () => {
    if (!note) return;
    const title = note.title.trim() || "SGF 메모";
    const text = stripHtml(note.body);
    const shareUrl = `${window.location.origin}/#share=${encodeSharePayload(note)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        showShareToast("공유 완료");
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    await copyTextToClipboard(`${title}\n\n${text}\n\n${shareUrl}`);
    showShareToast("공유 내용 복사됨");
  };

  const handleCopyBody = async () => {
    if (!note) return;
    const title = note.title.trim() || "제목 없음";
    await copyTextToClipboard(`${title}\n\n${stripHtml(note.body)}`);
    showShareToast("본문 복사됨");
  };

  const handleCopyShareLink = async () => {
    if (!note) return;
    const shareUrl = `${window.location.origin}/#share=${encodeSharePayload(note)}`;
    await copyTextToClipboard(shareUrl);
    showShareToast("공유 링크 복사됨");
  };

  const currentFont = editor?.getAttributes("textStyle")?.fontFamily || "";
  const currentFontSize = editor?.getAttributes("textStyle")?.fontSize || "";
  const currentColor = editor?.getAttributes("textStyle")?.color || "#181a1f";
  const charLength = note ? stripHtml(note.body).length : 0;

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
          <button
            type="button"
            className="ghost-btn home-btn"
            onClick={onOpenDashboard}
            title="메인 대시보드"
          >
            🏠 홈
          </button>
          <span className="save-status">
            {shareFeedback
              ? `✅ ${shareFeedback}`
              : uploadingImage
                ? "사진 압축·업로드 중..."
                : uploadingFile
                  ? "파일 업로드 중..."
                  : note
                    ? saveStatus
                    : ""}
          </span>
        </div>

        {note && (
          <div className="toolbar-right">
            <span className="char-count">{charLength}자</span>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                onOpenShare
                  ? onOpenShare(note)
                  : setShareMenuOpen((prev) => !prev)
              }
              title="메모 공유하기"
            >
              📤 공유
            </button>
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

          {editor && (
            <div className="format-toolbar" role="toolbar" aria-label="서식 도구">
              <select
                className="font-select"
                value={currentFont}
                aria-label="글씨체 선택"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    editor.chain().focus().unsetFontFamily().run();
                  } else {
                    editor.chain().focus().setFontFamily(val).run();
                  }
                }}
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                className="font-select"
                value={currentFontSize}
                aria-label="글자 크기 선택"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    editor.chain().focus().unsetFontSize().run();
                  } else {
                    editor.chain().focus().setFontSize(val).run();
                  }
                }}
              >
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <span className="toolbar-divider" />

              <button
                type="button"
                className={`fmt-btn${editor.isActive("bold") ? " active" : ""}`}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="굵게 (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className={`fmt-btn${editor.isActive("italic") ? " active" : ""}`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="기울임 (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                className={`fmt-btn${editor.isActive("underline") ? " active" : ""}`}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="밑줄 (Ctrl+U)"
              >
                <u>U</u>
              </button>
              <button
                type="button"
                className={`fmt-btn${editor.isActive("strike") ? " active" : ""}`}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="취소선"
              >
                <s>S</s>
              </button>

              <span className="toolbar-divider" />

              <label className="color-picker-btn" title="글자색 변경">
                <span style={{ borderBottom: `3px solid ${currentColor}` }}>A</span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) =>
                    editor.chain().focus().setColor(e.target.value).run()
                  }
                  aria-label="글자색 선택"
                />
              </label>

              <div className="highlight-group" title="형광펜 배경색">
                {HIGHLIGHT_OPTIONS.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    className={`highlight-dot${
                      editor.isActive("highlight", { color: item.color })
                        ? " active"
                        : ""
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={`형광펜: ${item.label}`}
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color: item.color })
                        .run()
                    }
                  />
                ))}
                <button
                  type="button"
                  className="fmt-btn"
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  title="형광펜 지우기"
                >
                  지움
                </button>
              </div>

              <span className="toolbar-divider" />

              <button
                type="button"
                className={`fmt-btn${editor.isActive("bulletList") ? " active" : ""}`}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="글머리 기호"
              >
                • 목록
              </button>
              <button
                type="button"
                className={`fmt-btn${editor.isActive("orderedList") ? " active" : ""}`}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="번호 목록"
              >
                1. 목록
              </button>
              <button
                type="button"
                className={`fmt-btn${editor.isActive("blockquote") ? " active" : ""}`}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                title="인용구"
              >
                ❝ 인용
              </button>

              <span className="toolbar-divider" />

              <button
                type="button"
                className="fmt-btn image-btn"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                title="사진 첨부 (자동 압축)"
              >
                {uploadingImage ? "⏳ 업로드 중" : "🖼️ 사진"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                className="fmt-btn image-btn"
                disabled={uploadingFile}
                onClick={() => attachmentInputRef.current?.click()}
                title="PDF, 문서 등 파일 첨부 (최대 50MB)"
              >
                {uploadingFile ? "⏳ 첨부 중" : "📎 파일"}
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.txt,.csv,.zip,image/*"
                className="hidden"
                onChange={handleAttachmentChange}
              />
            </div>
          )}

          {(note.attachments || []).length > 0 && (
            <div className="attachments-bar" aria-label="첨부파일 목록">
              {(note.attachments || []).map((att) => (
                <div key={att.url} className="attachment-chip">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-link"
                    title={`${att.name} 열기`}
                  >
                    <span>
                      {att.type?.includes("pdf") ? "📄" : "📎"} {att.name}
                    </span>
                    <span className="attachment-size">
                      ({formatFileSize(att.size)})
                    </span>
                  </a>
                  <button
                    type="button"
                    className="tag-remove-btn"
                    title="첨부파일 제거"
                    onClick={() => onRemoveAttachment(att.url)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="tiptap-wrapper">
            <EditorContent editor={editor} />
          </div>
        </section>
      ) : (
        <section className="empty-state">
          <div className="empty-icon">✍️</div>
          <h2>선택된 메모가 없습니다</h2>
          <p>왼쪽 목록에서 메모를 선택하거나 새 메모를 만들어 보세요.</p>
          <div className="toolbar-right">
            <button
              type="button"
              className="ghost-btn"
              onClick={onOpenDashboard}
            >
              🏠 대시보드 보기
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={onCreateNote}
            >
              + 첫 메모 작성하기
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
