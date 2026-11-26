import { useMemo, useState } from "react";
import {
  SGF_CATEGORIES,
  formatDate,
  normalizeTag,
  parseCategory,
  stripHtml,
} from "../utils/noteHelpers";
import BrandLogo from "./BrandLogo";

function extractFirstImageUrl(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export default function HomeDashboard({
  notes,
  allTags,
  activeTagFilter,
  onSelectTagFilter,
  activeCategory,
  onSelectCategory,
  activeSubCategory,
  userEmail,
  onSelectNote,
  onCreateNote,
  onQuickCreateNote,
  onShareNote,
  onTogglePinNote,
  onToggleSidebar,
  onInstallApp,
  canInstallPwa,
}) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickBody, setQuickBody] = useState("");
  const [quickTags, setQuickTags] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const pinnedNotes = useMemo(
    () => notes.filter((n) => n.pinned),
    [notes]
  );

  const totalAttachments = useMemo(() => {
    return notes.reduce((acc, n) => {
      const attCount = (n.attachments || []).length;
      const imgMatches = (n.body || "").match(/<img\b/gi);
      return acc + attCount + (imgMatches ? imgMatches.length : 0);
    }, 0);
  }, [notes]);

  const displayedNotes = useMemo(() => {
    return notes.filter((n) => {
      const { main, sub } = parseCategory(n.category);
      if (activeCategory !== "ALL" && main !== activeCategory) {
        return false;
      }
      if (activeSubCategory && sub !== activeSubCategory) {
        return false;
      }
      if (activeTagFilter && !(n.tags || []).includes(activeTagFilter)) {
        return false;
      }
      return true;
    });
  }, [notes, activeTagFilter, activeCategory, activeSubCategory]);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() && !quickBody.trim()) return;
    setQuickSaving(true);
    try {
      const parsedTags = quickTags
        .split(/[\s,]+/)
        .map(normalizeTag)
        .filter(Boolean);
      await onQuickCreateNote({
        title: quickTitle.trim() || "빠른 메모",
        body: `<p>${quickBody
          .trim()
          .replace(/\n/g, "</p><p>")}</p>`,
        tags: parsedTags,
      });
      setQuickTitle("");
      setQuickBody("");
      setQuickTags("");
    } finally {
      setQuickSaving(false);
    }
  };

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <main className="editor-area dashboard-area">
      <header className="editor-toolbar dashboard-topbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="icon-btn mobile-only"
            onClick={onToggleSidebar}
            title="목록 열기/닫기"
          >
            ☰
          </button>
          <span className="dashboard-date-badge">{todayStr}</span>
        </div>
        <div className="toolbar-right">
          <button
            type="button"
            className="ghost-btn pwa-btn"
            onClick={onInstallApp}
            title="PC 바탕화면 또는 스마트폰 홈 화면에 앱으로 설치"
          >
            📲 {canInstallPwa ? "앱 바로 설치" : "어플로 설치 안내"}
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={onCreateNote}
          >
            + 새 메모 작성
          </button>
        </div>
      </header>

      <div className="dashboard-scroll">
        {/* 세광그린푸드(sgfco.kr) 스타일 상단 5대 GNB + 메가메뉴 드롭다운 */}
        <div
          className="sgf-gnb-wrapper"
          onMouseEnter={() => setMegaMenuOpen(true)}
          onMouseLeave={() => setMegaMenuOpen(false)}
        >
          <nav className="sgf-gnb" aria-label="SGF 카테고리 메뉴">
            <button
              type="button"
              className={`sgf-gnb-tab${activeCategory === "ALL" ? " active" : ""}`}
              onClick={() => onSelectCategory("ALL", null)}
            >
              <span className="gnb-en">ALL</span>
              <span className="gnb-ko">전체 ({notes.length})</span>
            </button>
            {SGF_CATEGORIES.map((cat) => {
              const count = notes.filter(
                (n) => parseCategory(n.category).main === cat.id
              ).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`sgf-gnb-tab${activeCategory === cat.id ? " active" : ""}`}
                  onClick={() => {
                    onSelectCategory(
                      activeCategory === cat.id && !activeSubCategory
                        ? "ALL"
                        : cat.id,
                      null
                    );
                    setMegaMenuOpen((prev) => !prev);
                  }}
                >
                  <span className="gnb-en">{cat.label}</span>
                  <span className="gnb-ko">
                    {cat.sub} ({count})
                  </span>
                </button>
              );
            })}
          </nav>

          {megaMenuOpen && (
            <div className="sgf-mega-menu" role="region" aria-label="하위분류 메뉴">
              <div className="sgf-mega-spacer" />
              {SGF_CATEGORIES.map((cat) => (
                <div key={cat.id} className="sgf-mega-col">
                  {cat.children.map((child) => {
                    const isSubActive =
                      activeCategory === cat.id && activeSubCategory === child;
                    return (
                      <button
                        key={child}
                        type="button"
                        className={`sgf-mega-item${isSubActive ? " active" : ""}`}
                        onClick={() => {
                          onSelectCategory(cat.id, isSubActive ? null : child);
                          setMegaMenuOpen(false);
                        }}
                      >
                        {child}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상단 히어로 배너 */}
        <section className="dashboard-hero">
          <div className="hero-left">
            <div className="hero-brand-line">
              <BrandLogo showSubtitle={false} />
              <span className="hero-pill">SGF CLOUD WORKSPACE</span>
            </div>
            <h2>세광그린푸드 스마트 메모 & 클라우드 포털</h2>
            <p>
              PC와 모바일 어디서나 실시간 동기화되는 업무 노트, 사진·문서 아카이브,
              카톡·웹 공유를 한곳에서 관리하세요. ({userEmail})
            </p>
          </div>
          <div className="hero-stats-grid">
            <div className="stat-card">
              <span className="stat-label">전체 메모</span>
              <strong className="stat-value">{notes.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">중요 고정</span>
              <strong className="stat-value accent">{pinnedNotes.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">#태그 분류</span>
              <strong className="stat-value">{allTags.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">사진·첨부</span>
              <strong className="stat-value">{totalAttachments}</strong>
            </div>
          </div>
        </section>

        {/* 빠른 메모 등록 위젯 */}
        <section className="quick-memo-card">
          <form onSubmit={handleQuickSubmit} className="quick-memo-form">
            <div className="quick-memo-header">
              <strong>⚡ 빠른 메모 등록</strong>
              <span>에디터를 열지 않고 메인 화면에서 바로 클라우드에 기록합니다</span>
            </div>
            <div className="quick-memo-inputs">
              <input
                type="text"
                placeholder="제목 (예: 매장 점검 메모, 아이디어)"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="quick-input-title"
              />
              <input
                type="text"
                placeholder="#태그 (예: 업무 회의)"
                value={quickTags}
                onChange={(e) => setQuickTags(e.target.value)}
                className="quick-input-tags"
              />
            </div>
            <div className="quick-memo-bottom">
              <textarea
                rows={2}
                placeholder="메모할 내용을 간단히 입력하고 오른쪽 [즉시 등록]을 누르세요..."
                value={quickBody}
                onChange={(e) => setQuickBody(e.target.value)}
                className="quick-textarea"
              />
              <button
                type="submit"
                className="primary-btn quick-submit-btn"
                disabled={quickSaving || (!quickTitle.trim() && !quickBody.trim())}
              >
                {quickSaving ? "저장 중..." : "즉시 등록"}
              </button>
            </div>
          </form>
        </section>

        {/* 고정 메모 섹션 */}
        {pinnedNotes.length > 0 && (
          <section className="dashboard-section">
            <div className="section-header">
              <h3>📌 상단 고정된 중요 메모</h3>
              <span className="section-count">{pinnedNotes.length}개</span>
            </div>
            <div className="dashboard-cards-grid">
              {pinnedNotes.map((note) => {
                const thumb = extractFirstImageUrl(note.body);
                return (
                  <article
                    key={note.id}
                    className="dash-note-card pinned"
                    onClick={() => onSelectNote(note.id)}
                  >
                    {thumb && (
                      <div className="dash-card-thumb">
                        <img src={thumb} alt="첨부 미리보기" loading="lazy" />
                      </div>
                    )}
                    <div className="dash-card-top">
                      <span className="pin-badge">📌 고정</span>
                      <div
                        className="dash-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="card-mini-btn"
                          onClick={() => onShareNote(note)}
                          title="이 메모 공유"
                        >
                          🔗 공유
                        </button>
                        <button
                          type="button"
                          className="card-mini-btn"
                          onClick={() => onTogglePinNote(note)}
                          title="고정 해제"
                        >
                          고정해제
                        </button>
                      </div>
                    </div>
                    <h4 className="dash-card-title">
                      {note.title.trim() || "제목 없음"}
                    </h4>
                    <p className="dash-card-preview">
                      {stripHtml(note.body).slice(0, 140) || "내용 없음"}
                    </p>
                    <div className="dash-card-footer">
                      <div className="dash-card-tags">
                        {(note.tags || []).slice(0, 3).map((t) => (
                          <span key={t} className="note-tag-mini">
                            {t}
                          </span>
                        ))}
                        {(note.attachments || []).length > 0 && (
                          <span className="note-tag-mini">
                            📎 {note.attachments.length}
                          </span>
                        )}
                      </div>
                      <span className="dash-card-date">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 전체 & 태그별 메모 보드 */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>🗂️ 카테고리 및 전체 메모 보드</h3>
            <div className="dashboard-tag-tabs">
              <button
                type="button"
                className={`tag-filter-chip${activeTagFilter === null ? " active" : ""}`}
                onClick={() => onSelectTagFilter(null)}
              >
                전체 ({notes.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-filter-chip${activeTagFilter === tag ? " active" : ""}`}
                  onClick={() =>
                    onSelectTagFilter(activeTagFilter === tag ? null : tag)
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-cards-grid">
            {displayedNotes.map((note) => {
              const thumb = extractFirstImageUrl(note.body);
              return (
                <article
                  key={note.id}
                  className="dash-note-card"
                  onClick={() => onSelectNote(note.id)}
                >
                  {thumb && (
                    <div className="dash-card-thumb">
                      <img src={thumb} alt="첨부 미리보기" loading="lazy" />
                    </div>
                  )}
                  <div className="dash-card-top">
                    <span className="dash-card-date">
                      {formatDate(note.updatedAt)}
                    </span>
                    <div
                      className="dash-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="card-mini-btn"
                        onClick={() => onShareNote(note)}
                      >
                        🔗 공유
                      </button>
                    </div>
                  </div>
                  <h4 className="dash-card-title">
                    {note.title.trim() || "제목 없음"}
                  </h4>
                  <p className="dash-card-preview">
                    {stripHtml(note.body).slice(0, 120) || "내용 없음"}
                  </p>
                  <div className="dash-card-footer">
                    <div className="dash-card-tags">
                      {(note.tags || []).map((t) => (
                        <span key={t} className="note-tag-mini">
                          {t}
                        </span>
                      ))}
                      {(note.attachments || []).length > 0 && (
                        <span className="note-tag-mini">
                          📎 {note.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
