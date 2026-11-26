import TopNavHeader from "./TopNavHeader";
import {
  BRAND_CONTENT,
  BUSINESS_CONTENT,
  COMPANY_CONTENT,
  STORE_SUMMARY,
} from "../data/sgfContent";
import { formatDate, stripHtml } from "../utils/noteHelpers";

export default function HomeDashboard({
  notes,
  userEmail,
  isDark,
  canInstallPwa,
  onNavigateSection,
  onOpenCommunityNotepad,
  onSelectNote,
  onCreateNote,
  onToggleTheme,
  onInstallApp,
  onLogout,
}) {
  const recentNotes = [...notes]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    })
    .slice(0, 6);

  const brandNames = Object.keys(BRAND_CONTENT);
  const businessNames = Object.keys(BUSINESS_CONTENT);

  return (
    <div className="portal-shell">
      <TopNavHeader
        activeSection="HOME"
        activeSub=""
        isDark={isDark}
        canInstallPwa={canInstallPwa}
        onGoHome={() => {}}
        onNavigateSection={onNavigateSection}
        onOpenCommunityNotepad={onOpenCommunityNotepad}
        onToggleTheme={onToggleTheme}
        onInstallApp={onInstallApp}
        onLogout={onLogout}
      />

      <main className="portal-main home-main">
        {/* 1. 세광그린푸드 메인 히어로 */}
        <section className="sgf-hero-section">
          <div className="sgf-hero-content">
            <span className="portal-eyebrow light">
              SEKWANG GREEN FOOD · OFFER A BRAND-NEW STANDARD
            </span>
            <h1>
              문화적 가치를 제시하는 외식 전문 기업
              <br />
              <span>오늘을 더 의미있게, 내일을 더 특별하게</span>
            </h1>
            <p>
              브랜드당 평균 준비 기간 3년, 모방할 수 없는 오리지널리티와
              사람이 빛나는 공간으로 올바른 외식 산업 문화를 만들어 나갑니다.
            </p>
            <div className="sgf-hero-actions">
              <button
                type="button"
                className="hero-cta-btn"
                onClick={() => onNavigateSection("COMPANY", "기업소개")}
              >
                COMPANY 기업소개 보기
              </button>
              <button
                type="button"
                className="hero-ghost-btn"
                onClick={() => onOpenCommunityNotepad(null)}
              >
                📝 COMMUNITY 메모장 열기 ({notes.length})
              </button>
            </div>
          </div>

          <div className="sgf-hero-metrics">
            <div className="metric-box">
              <span className="metric-label">2025 연 매출</span>
              <strong className="metric-val">1,500억원</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">전국 운영 매장</span>
              <strong className="metric-val">{STORE_SUMMARY.total}개점</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">대표 외식 브랜드</span>
              <strong className="metric-val">{brandNames.length}개</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">브랜드 평균 준비</span>
              <strong className="metric-val">3년</strong>
            </div>
          </div>
        </section>

        {/* 2. 4-獨 브랜드 철학 요약 */}
        <section className="portal-card">
          <div className="section-header-row">
            <div>
              <span className="portal-eyebrow">COMPANY · 4-獨 전략</span>
              <h2 className="portal-section-heading">
                세광만의 독창적인 브랜드 아이덴티티
              </h2>
            </div>
            <button
              type="button"
              className="link-btn"
              onClick={() => onNavigateSection("COMPANY", "비전")}
            >
              비전 · 연혁 자세히 보기 →
            </button>
          </div>
          <div className="portal-grid-4">
            {COMPANY_CONTENT.기업소개.strategyItems.map((item) => (
              <div key={item.num} className="portal-feature-box">
                <span className="feature-num">{item.num}</span>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. BUSINESS 4대 사업 영역 */}
        <section className="portal-card">
          <div className="section-header-row">
            <div>
              <span className="portal-eyebrow">BUSINESS · 수직 계열화</span>
              <h2 className="portal-section-heading">세광그린푸드 핵심 사업</h2>
            </div>
            <button
              type="button"
              className="link-btn"
              onClick={() => onNavigateSection("BUSINESS", "외식사업")}
            >
              사업소개 전체 보기 →
            </button>
          </div>
          <div className="portal-grid-2">
            {businessNames.map((bName, idx) => {
              const info = BUSINESS_CONTENT[bName];
              return (
                <button
                  key={bName}
                  type="button"
                  className="home-link-card"
                  onClick={() => onNavigateSection("BUSINESS", bName)}
                >
                  <span className="feature-num">0{idx + 1}</span>
                  <h4>{bName}</h4>
                  <p>{info.subtitle}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. 7대 브랜드 쇼케이스 */}
        <section className="portal-card">
          <div className="section-header-row">
            <div>
              <span className="portal-eyebrow">BRAND · 7 BRANDS</span>
              <h2 className="portal-section-heading">세광그린푸드 브랜드</h2>
            </div>
            <button
              type="button"
              className="link-btn"
              onClick={() => onNavigateSection("FRANCHISE", "창업 절차")}
            >
              가맹 창업 10단계 보기 →
            </button>
          </div>
          <div className="portal-grid-3">
            {brandNames.map((brand) => {
              const b = BRAND_CONTENT[brand];
              return (
                <button
                  key={brand}
                  type="button"
                  className="home-link-card"
                  onClick={() => onNavigateSection("BRAND", brand)}
                >
                  <div className="brand-card-top">
                    <h4>{brand}</h4>
                    <span className="store-mini">{b.stores}개점</span>
                  </div>
                  <p>{b.tagline}</p>
                  <div className="brand-menu-chips">
                    {b.menus.slice(0, 2).map((m) => (
                      <span key={m} className="menu-chip">
                        {m}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. COMMUNITY 클라우드 메모장 바로가기 */}
        <section className="portal-card">
          <div className="section-header-row">
            <div>
              <span className="portal-eyebrow">COMMUNITY · CLOUD NOTEPAD</span>
              <h2 className="portal-section-heading">
                내 클라우드 메모 ({userEmail})
              </h2>
            </div>
            <div className="toolbar-right">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => onOpenCommunityNotepad(null)}
              >
                메모장 전체 열기
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={onCreateNote}
              >
                + 새 메모 작성
              </button>
            </div>
          </div>

          {recentNotes.length === 0 ? (
            <div className="dash-empty">
              아직 작성된 메모가 없습니다. [+ 새 메모 작성]을 눌러 시작해
              보세요!
            </div>
          ) : (
            <div className="portal-grid-3">
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
                  <span className="dash-card-date">
                    {formatDate(note.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="portal-footer">
        <strong>(주)세광그린푸드</strong> · 서울특별시 서초구 서초대로 50길 24
        청화빌딩 4·5층 · T. 02-581-8188 · F. 02-584-8188 · E. sgf@sgfco.kr
      </footer>
    </div>
  );
}
