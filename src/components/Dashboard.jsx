import { formatDate, stripHtml } from "../utils/noteHelpers";

export default function Dashboard({
  notes,
  allTags,
  onSelectNote,
  onCreateNote,
  onSelectTagFilter,
}) {
  const pinnedNotes = notes.filter((n) => n.pinned);
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  const tagCounts = allTags.map((tag) => ({
    tag,
    count: notes.filter((n) => (n.tags || []).includes(tag)).length,
  }));

  return (
    <section className="dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-text">
          <span className="dashboard-pill">Sekwang Green Food</span>
          <h2>오늘을 더 의미있게, 내일을 더 특별하게</h2>
          <p>
            아이디어와 업무 기록을 SGF 클라우드 메모장에 정리하고, PC와
            스마트폰에서 언제든 이어서 확인하세요.
          </p>
        </div>
        <button
          type="button"
          className="hero-cta-btn"
          onClick={onCreateNote}
        >
          + 새 메모 작성하기
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-label">전체 메모</span>
          <strong className="stat-value">{notes.length}개</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">고정 공지</span>
          <strong className="stat-value">{pinnedNotes.length}개</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">등록된 태그</span>
          <strong className="stat-value">{allTags.length}개</strong>
        </div>
      </div>

      {pinnedNotes.length > 0 && (
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">📌 고정 공지 & 중요 메모</h3>
          <div className="dashboard-grid">
            {pinnedNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className="dash-note-card pinned"
                onClick={() => onSelectNote(note.id)}
              >
                <div className="dash-card-top">
                  <span className="dash-card-title">
                    {note.title.trim() || "제목 없음"}
                  </span>
                  <span className="pin-badge">고정</span>
                </div>
                <p className="dash-card-preview">
                  {stripHtml(note.body).replace(/\n+/g, " ") || "내용 없음"}
                </p>
                <span className="dash-card-date">
                  {formatDate(note.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🕒 최근 작성한 메모</h3>
        {recentNotes.length === 0 ? (
          <div className="dash-empty">
            아직 작성된 메모가 없습니다. 첫 메모를 만들어 보세요!
          </div>
        ) : (
          <div className="dashboard-grid">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className="dash-note-card"
                onClick={() => onSelectNote(note.id)}
              >
                <div className="dash-card-top">
                  <span className="dash-card-title">
                    {note.title.trim() || "제목 없음"}
                  </span>
                  {note.pinned && <span className="pin-badge">고정</span>}
                </div>
                <p className="dash-card-preview">
                  {stripHtml(note.body).replace(/\n+/g, " ") || "내용 없음"}
                </p>
                <div className="dash-card-footer">
                  <span className="dash-card-date">
                    {formatDate(note.updatedAt)}
                  </span>
                  {(note.tags || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="note-tag-mini">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {tagCounts.length > 0 && (
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">🏷️ 태그별 현황</h3>
          <div className="dash-tag-grid">
            {tagCounts.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                className="dash-tag-card"
                onClick={() => onSelectTagFilter(tag)}
              >
                <span className="dash-tag-name">{tag}</span>
                <span className="dash-tag-count">{count}건</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
