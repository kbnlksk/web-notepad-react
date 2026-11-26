import { useMemo, useState } from "react";
import { formatDate, stripHtml } from "../utils/noteHelpers";
import BrandLogo from "./BrandLogo";

export function encodeSharedNote(note) {
  if (!note) return "";
  try {
    const payload = {
      t: note.title || "제목 없음",
      b: note.body || "",
      g: note.tags || [],
      a: (note.attachments || []).map((att) => ({
        name: att.name,
        url: att.url,
        size: att.size,
      })),
      u: note.updatedAt || new Date().toISOString(),
    };
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (err) {
    console.error("encodeSharedNote error:", err);
    return "";
  }
}

export function decodeSharedNote(encoded) {
  if (!encoded) return null;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return {
      title: parsed.t || "제목 없음",
      body: parsed.b || "",
      tags: Array.isArray(parsed.g) ? parsed.g : [],
      attachments: Array.isArray(parsed.a) ? parsed.a : [],
      updatedAt: parsed.u || null,
    };
  } catch (err) {
    console.error("decodeSharedNote error:", err);
    return null;
  }
}

export function buildFormattedShareText(note, shareUrl) {
  const title = (note?.title || "").trim() || "제목 없음";
  const tags =
    note?.tags && note.tags.length > 0 ? `\n태그: ${note.tags.join(" ")}` : "";
  const plainBody = stripHtml(note?.body || "").trim();
  const attachments =
    note?.attachments && note.attachments.length > 0
      ? `\n\n[첨부파일]\n` +
        note.attachments.map((a) => `- ${a.name}: ${a.url}`).join("\n")
      : "";
  const linkLine = shareUrl ? `\n\n[메모 웹에서 보기]\n${shareUrl}` : "";

  return `[SGF 메모장] ${title}${tags}\n${"─".repeat(22)}\n${plainBody}${attachments}${linkLine}`;
}

export function downloadNoteAsWord(note) {
  if (!note) return;
  const titleText = (note.title || "").trim() || "제목 없음";
  const tagsHtml =
    note.tags && note.tags.length > 0
      ? `<p style="color:#009e9d;font-weight:bold;">${note.tags.join(" ")}</p>`
      : "";
  const attachmentsHtml =
    note.attachments && note.attachments.length > 0
      ? `<hr/><h4>첨부파일</h4><ul>` +
        note.attachments
          .map(
            (a) =>
              `<li><a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.name}</a></li>`
          )
          .join("") +
        `</ul>`
      : "";

  const htmlDoc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${titleText}</title>
  <style>
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; line-height: 1.7; color: #181a1f; padding: 24px; }
    h1 { font-size: 22pt; margin-bottom: 6px; color: #111827; }
    .meta { font-size: 10pt; color: #6b7280; margin-bottom: 18px; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
    blockquote { border-left: 3px solid #009e9d; padding-left: 12px; color: #4b5563; }
  </style>
</head>
<body>
  <h1>${titleText}</h1>
  <div class="meta">SGF 세광그린푸드 메모장 | 마지막 수정: ${formatDate(note.updatedAt)}</div>
  ${tagsHtml}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
  <div>${note.body || ""}</div>
  ${attachmentsHtml}
</body>
</html>`;

  const safeName = titleText.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  const blob = new Blob(["\ufeff", htmlDoc], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName || "메모"}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function SharedNoteViewer({ sharedNote, onCloseShared, onImportShared }) {
  const [copied, setCopied] = useState(false);

  if (!sharedNote) return null;

  const handleCopyText = async () => {
    const text = buildFormattedShareText(sharedNote, window.location.href);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="shared-viewer-page">
      <header className="shared-viewer-header">
        <div className="shared-brand-wrap" onClick={onCloseShared}>
          <BrandLogo />
          <span className="shared-badge">공유된 읽기 전용 메모</span>
        </div>
        <div className="shared-actions">
          <button type="button" className="ghost-btn" onClick={handleCopyText}>
            {copied ? "복사 완료" : "본문 복사"}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => downloadNoteAsWord(sharedNote)}
          >
            워드(.doc) 저장
          </button>
          {onImportShared && (
            <button
              type="button"
              className="primary-btn"
              onClick={() => onImportShared(sharedNote)}
            >
              + 내 메모장에 저장
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={onCloseShared}>
            내 메모장으로 이동
          </button>
        </div>
      </header>

      <main className="shared-viewer-card">
        <h1 className="shared-title">{sharedNote.title || "제목 없음"}</h1>
        {sharedNote.updatedAt && (
          <div className="note-meta">
            작성·수정 시각: {formatDate(sharedNote.updatedAt)}
          </div>
        )}
        {sharedNote.tags && sharedNote.tags.length > 0 && (
          <div className="tag-list" style={{ marginBottom: 16 }}>
            {sharedNote.tags.map((t) => (
              <span key={t} className="tag-chip">
                {t}
              </span>
            ))}
          </div>
        )}
        {sharedNote.attachments && sharedNote.attachments.length > 0 && (
          <div className="attachments-bar">
            {sharedNote.attachments.map((att) => (
              <div key={att.url} className="attachment-chip">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-link"
                >
                  📎 {att.name}
                </a>
              </div>
            ))}
          </div>
        )}
        <div
          className="tiptap-prose shared-body"
          dangerouslySetInnerHTML={{ __html: sharedNote.body || "" }}
        />
      </main>
    </div>
  );
}

export default function ShareModal({ note, onClose, onDownloadTxt }) {
  const [statusMsg, setStatusMsg] = useState("");

  const shareUrl = useMemo(() => {
    if (!note) return "";
    const encoded = encodeSharedNote(note);
    if (!encoded) return window.location.origin;
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?share=${encoded}`;
  }, [note]);

  if (!note) return null;

  const isUrlTooLong = shareUrl.length > 7500;

  const flashStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  const handleCopyForKakao = async () => {
    try {
      const text = buildFormattedShareText(
        note,
        isUrlTooLong ? window.location.origin : shareUrl
      );
      await navigator.clipboard.writeText(text);
      flashStatus("카카오톡·메신저 붙여넣기용 텍스트가 복사되었습니다!");
    } catch {
      flashStatus("클립보드 복사에 실패했습니다.");
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flashStatus("읽기 전용 공유 링크가 복사되었습니다!");
    } catch {
      flashStatus("링크 복사에 실패했습니다.");
    }
  };

  const handleSystemShare = async () => {
    const title = (note.title || "").trim() || "SGF 메모 공유";
    const text = buildFormattedShareText(note, "");
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[SGF 메모장] ${title}`,
          text,
          url: isUrlTooLong ? window.location.origin : shareUrl,
        });
        flashStatus("공유 창을 열었습니다.");
      } catch (err) {
        if (err?.name !== "AbortError") {
          handleCopyForKakao();
        }
      }
    } else {
      await handleCopyForKakao();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card share-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="메모 공유 및 내보내기"
      >
        <div className="modal-header">
          <div>
            <h3>메모 공유 및 내보내기</h3>
            <p className="modal-subtitle">
              "{note.title.trim() || "제목 없음"}" 메모를 카톡, 링크, 문서로 공유합니다.
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {statusMsg && <div className="share-status-banner">{statusMsg}</div>}

        <div className="share-grid">
          <button
            type="button"
            className="share-action-card kakao"
            onClick={handleSystemShare}
          >
            <span className="share-card-icon">💬</span>
            <div className="share-card-body">
              <strong>카카오톡 / 시스템 공유</strong>
              <span>기기 공유 시트를 열거나 카톡 전송용 포맷을 복사합니다</span>
            </div>
          </button>

          <button
            type="button"
            className="share-action-card"
            onClick={handleCopyForKakao}
          >
            <span className="share-card-icon">📋</span>
            <div className="share-card-body">
              <strong>메신저용 전체 내용 복사</strong>
              <span>제목 + 태그 + 본문 + 첨부 링크를 깔끔하게 복사합니다</span>
            </div>
          </button>

          <button
            type="button"
            className="share-action-card"
            onClick={handleCopyShareLink}
          >
            <span className="share-card-icon">🔗</span>
            <div className="share-card-body">
              <strong>읽기 전용 웹 공유 링크 복사</strong>
              <span>로그인 없이도 웹에서 바로 열람할 수 있는 링크입니다</span>
            </div>
          </button>

          <button
            type="button"
            className="share-action-card"
            onClick={() => {
              downloadNoteAsWord(note);
              flashStatus("워드(.doc) 문서를 다운로드했습니다.");
            }}
          >
            <span className="share-card-icon">📘</span>
            <div className="share-card-body">
              <strong>워드(.doc) 문서로 저장</strong>
              <span>글자 서식과 사진이 포함된 MS 워드 파일을 내려받습니다</span>
            </div>
          </button>

          <button
            type="button"
            className="share-action-card"
            onClick={() => {
              onDownloadTxt();
              flashStatus("텍스트(.txt) 파일을 다운로드했습니다.");
            }}
          >
            <span className="share-card-icon">📄</span>
            <div className="share-card-body">
              <strong>텍스트(.txt) 파일 저장</strong>
              <span>순수 텍스트만 가볍게 파일로 내려받습니다</span>
            </div>
          </button>
        </div>

        <div className="share-url-box">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={(e) => e.target.select()}
            aria-label="공유 링크 URL"
          />
          <button
            type="button"
            className="primary-btn"
            onClick={handleCopyShareLink}
          >
            링크 복사
          </button>
        </div>
      </div>
    </div>
  );
}
