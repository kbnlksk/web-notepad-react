import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Image from "@tiptap/extension-image";
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

const FONT_OPTIONS = [
  { label: "기본 고딕", value: "" },
  { label: "명조 / 세리프", value: '"Noto Serif KR", "Batang", Georgia, serif' },
  { label: "둥근 스타일", value: '"Jua", "Dongle", "Apple SD Gothic Neo", cursive, sans-serif' },
  { label: "고정폭 (코드)", value: '"Consolas", "Courier New", monospace' },
];

export default function Editor({
  note,
  userId,
  saveStatus,
  onToggleSidebar,
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

  // 다른 메모로 전환하거나 외부 실시간 변경이 들어올 때 에디터 내용 동기화
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

  const currentFont = editor?.getAttributes("textStyle")?.fontFamily || "";
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
          <span className="save-status">
            {uploadingImage
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
