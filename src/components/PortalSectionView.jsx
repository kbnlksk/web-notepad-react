import {
  BRAND_CONTENT,
  BUSINESS_CONTENT,
  COMPANY_CONTENT,
  FRANCHISE_CONTENT,
} from "../data/sgfContent";
import { SGF_CATEGORIES } from "../utils/noteHelpers";
import TopNavHeader from "./TopNavHeader";

export default function PortalSectionView({
  section,
  subSection,
  isDark,
  canInstallPwa,
  onGoHome,
  onNavigateSection,
  onOpenCommunityNotepad,
  onToggleTheme,
  onInstallApp,
  onLogout,
}) {
  const catMeta =
    SGF_CATEGORIES.find((c) => c.id === section) || SGF_CATEGORIES[0];
  const currentSub = subSection || catMeta.children[0];

  return (
    <div className="portal-shell">
      <TopNavHeader
        activeSection={section}
        activeSub={currentSub}
        isDark={isDark}
        canInstallPwa={canInstallPwa}
        onGoHome={onGoHome}
        onNavigateSection={onNavigateSection}
        onOpenCommunityNotepad={onOpenCommunityNotepad}
        onToggleTheme={onToggleTheme}
        onInstallApp={onInstallApp}
        onLogout={onLogout}
      />

      <main className="portal-main">
        <div className="portal-breadcrumb">
          <button type="button" className="link-btn" onClick={onGoHome}>
            HOME
          </button>
          <span>›</span>
          <span>{catMeta.label}</span>
          <span>›</span>
          <strong>{currentSub}</strong>
        </div>

        <h1 className="portal-page-title">{currentSub}</h1>

        {/* 하위 탭 네비게이션 */}
        <div className="portal-subtabs" role="tablist">
          {catMeta.children.map((child) => (
            <button
              key={child}
              type="button"
              className={`portal-subtab${currentSub === child ? " active" : ""}`}
              onClick={() => onNavigateSection(section, child)}
            >
              {child}
            </button>
          ))}
        </div>

        {/* 섹션별 텍스트 콘텐츠 */}
        <div className="portal-content-body">
          {section === "COMPANY" && renderCompany(currentSub)}
          {section === "BUSINESS" && renderBusiness(currentSub)}
          {section === "BRAND" && renderBrand(currentSub)}
          {section === "FRANCHISE" && renderFranchise(currentSub)}
        </div>
      </main>

      <footer className="portal-footer">
        <strong>(주)세광그린푸드</strong> · 서울특별시 서초구 서초대로 50길 24
        청화빌딩 4·5층 · T. 02-581-8188 · F. 02-584-8188 · E. sgf@sgfco.kr
      </footer>
    </div>
  );
}

function renderCompany(sub) {
  if (sub === "기업소개") {
    const data = COMPANY_CONTENT.기업소개;
    return (
      <div className="portal-stack">
        <section className="portal-card">
          <span className="portal-eyebrow">{data.badge}</span>
          <h2 className="portal-section-heading">{data.title}</h2>
          <div className="portal-prose">
            {data.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </section>

        <section className="portal-card">
          <h3 className="portal-card-title">{data.strategyTitle}</h3>
          <p className="portal-card-lead">{data.strategyDesc}</p>
          <div className="portal-grid-2">
            {data.strategyItems.map((item) => (
              <div key={item.num} className="portal-feature-box">
                <span className="feature-num">{item.num}</span>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (sub === "비전") {
    const data = COMPANY_CONTENT.비전;
    return (
      <div className="portal-stack">
        <section className="portal-vision-banner">
          <span className="portal-eyebrow light">{data.badge}</span>
          <h2>{data.slogan}</h2>
          <p>{data.subtitle}</p>
        </section>

        <section className="portal-card">
          <h3 className="portal-card-title">3대 전략 방향</h3>
          <div className="portal-grid-3">
            {data.pillars.map((p) => (
              <div key={p.title} className="portal-feature-box">
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="portal-card">
          <h3 className="portal-card-title">핵심 가치 (Core Values)</h3>
          <div className="portal-grid-3">
            {data.values.map((v) => (
              <div key={v.en} className="portal-feature-box">
                <span className="feature-num">{v.en}</span>
                <h4>{v.ko}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (sub === "연혁") {
    return (
      <section className="portal-card">
        <div className="history-timeline">
          {COMPANY_CONTENT.연혁.map((entry) => (
            <div key={entry.year} className="history-row">
              <div className="history-year">{entry.year}</div>
              <ul className="history-items">
                {entry.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const loc = COMPANY_CONTENT.오시는길;
  return (
    <section className="portal-card">
      <h2 className="portal-section-heading">{loc.companyName}</h2>
      <div className="info-table">
        <div className="info-row">
          <span className="info-label">주소 (ADD)</span>
          <span>{loc.address}</span>
        </div>
        <div className="info-row">
          <span className="info-label">대표전화 (TEL)</span>
          <span>{loc.tel}</span>
        </div>
        <div className="info-row">
          <span className="info-label">팩스 (FAX)</span>
          <span>{loc.fax}</span>
        </div>
        <div className="info-row">
          <span className="info-label">이메일 (E-MAIL)</span>
          <span>{loc.email}</span>
        </div>
        <div className="info-row">
          <span className="info-label">운영시간</span>
          <span>{loc.hours}</span>
        </div>
      </div>
    </section>
  );
}

function renderBusiness(sub) {
  const data = BUSINESS_CONTENT[sub] || BUSINESS_CONTENT.외식사업;
  return (
    <div className="portal-stack">
      <section className="portal-card">
        <span className="portal-eyebrow">BUSINESS · {sub}</span>
        <h2 className="portal-section-heading">{data.subtitle}</h2>
        <div className="portal-grid-3">
          {data.cards.map((card, idx) => (
            <div key={card.title} className="portal-feature-box">
              <span className="feature-num">0{idx + 1}</span>
              <h4>{card.title}</h4>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function renderBrand(sub) {
  const data = BRAND_CONTENT[sub] || BRAND_CONTENT.달맞이광장바베큐;
  return (
    <section className="portal-card">
      <div className="brand-detail-head">
        <div>
          <span className="portal-eyebrow">SGF BRAND</span>
          <h2 className="portal-section-heading">{sub}</h2>
          <p className="portal-card-lead">{data.tagline}</p>
        </div>
        <div className="store-count-pill">운영 매장 {data.stores}개점</div>
      </div>
      <div className="portal-prose">
        <p>{data.desc}</p>
      </div>
      <div className="brand-menus-box">
        <h4>대표 메뉴</h4>
        <div className="brand-menu-chips">
          {data.menus.map((menu) => (
            <span key={menu} className="menu-chip">
              {menu}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function renderFranchise(sub) {
  if (sub === "브랜드 소개") {
    return (
      <div className="portal-grid-2">
        {FRANCHISE_CONTENT["브랜드 소개"].map((item) => (
          <section key={item.name} className="portal-card">
            <span className="portal-eyebrow">FRANCHISE BRAND</span>
            <h3 className="portal-card-title">{item.name}</h3>
            <p className="portal-card-body">{item.desc}</p>
          </section>
        ))}
      </div>
    );
  }

  if (sub === "창업 절차") {
    return (
      <div className="portal-grid-2">
        {FRANCHISE_CONTENT["창업 절차"].map((s) => (
          <section key={s.step} className="portal-card">
            <span className="feature-num">{s.step}</span>
            <h3 className="portal-card-title">{s.title}</h3>
            <p className="portal-card-lead">{s.summary}</p>
            <ul className="step-detail-list">
              {s.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  const inq = FRANCHISE_CONTENT["창업 문의"];
  return (
    <section className="portal-card">
      <span className="portal-eyebrow">FRANCHISE INQUIRY</span>
      <h2 className="portal-section-heading">{inq.title}</h2>
      <p className="portal-card-lead">{inq.desc}</p>
      <div className="info-table">
        <div className="info-row">
          <span className="info-label">가맹 문의 전화</span>
          <span>{inq.tel}</span>
        </div>
        <div className="info-row">
          <span className="info-label">이메일</span>
          <span>{inq.email}</span>
        </div>
        <div className="info-row">
          <span className="info-label">상담 가능 시간</span>
          <span>{inq.hours}</span>
        </div>
        <div className="info-row">
          <span className="info-label">본사 위치</span>
          <span>{inq.address}</span>
        </div>
      </div>
    </section>
  );
}
