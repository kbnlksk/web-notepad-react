import { formatDate } from "../utils/noteHelpers";

export default function Sidebar({
  isOpen,
  isDark,
  userEmail,
  onLogout,
  onToggleTheme,
  onCreateNote,
  searchQuery,
  onSearchChange,
  allTags,
  activeTagFilter,
  onSelectTagFilter,
  notes,
  totalCount,
  activeNoteId,
  onSelectNote,
}) {
  const isFiltered = Boolean(searchQuery.trim() || activeTagFilter);

  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            📝
          </span>
          <h1>메모장</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            aria-label="다크 모드 전환"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={onCreateNote}
            title="새 메모 만들기"
          >
            + 새 메모
          </button>
        </div>
      </div>

      <div className="search-box">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="메모 제목, 내용 또는 #태그 검색..."
          aria-label="메모 검색"
        />
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter-bar" aria-label="태그 필터">
          <button
            type="button"
            className={`tag-filter-chip${activeTagFilter === null ? " active" : ""}`}
            onClick={() => onSelectTagFilter(null)}
          >
            전체
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
      )}

      <div className="note-count">
        {isFiltered ? `필터 결과 ${notes.length}개` : `총 ${totalCount}개의 메모`}
      </div>

      <ul className="note-list" aria-label="메모 목록">
        {notes.map((note) => (
          <li
            key={note.id}
            className={`note-item${note.id === activeNoteId ? " active" : ""}`}
            onClick={() => onSelectNote(note.id)}
          >
            <div className="note-item-top">
              <span className="note-item-title">
                {note.title.trim() || "제목 없음"}
              </span>
              {note.pinned && <span className="pin-badge">고정</span>}
            </div>

            <div className="note-item-preview">
              {note.body.trim().replace(/\n+/g, " ") || "내용 없음"}
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="note-item-tags">
                {note.tags.map((tag) => (
                  <span key={tag} className="note-tag-mini">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="note-item-date">{formatDate(note.updatedAt)}</div>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <span className="user-email" title={userEmail}>
          {userEmail}
        </span>
        <button type="button" className="ghost-btn" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
