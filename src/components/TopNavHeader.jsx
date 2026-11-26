import { useState } from "react";
import BrandLogo from "./BrandLogo";
import { SGF_CATEGORIES } from "../utils/noteHelpers";

export default function TopNavHeader({
  activeSection,
  activeSub,
  isDark,
  canInstallPwa,
  onGoHome,
  onNavigateSection,
  onOpenCommunityNotepad,
  onToggleTheme,
  onInstallApp,
  onLogout,
}) {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const handleCategoryClick = (catId, sub = "") => {
    setMegaMenuOpen(false);
    if (catId === "COMMUNITY") {
      onOpenCommunityNotepad(sub || null);
    } else {
      onNavigateSection(catId, sub);
    }
  };

  return (
    <header
      className="portal-header-wrap"
      onMouseLeave={() => setMegaMenuOpen(false)}
    >
      <div className="portal-header">
        <button
          type="button"
          className="brand-home-trigger"
          onClick={() => {
            setMegaMenuOpen(false);
            onGoHome();
          }}
          title="세광그린푸드 홈으로"
        >
          <BrandLogo />
        </button>

        <nav
          className="portal-gnb"
          aria-label="세광그린푸드 메뉴"
          onMouseEnter={() => setMegaMenuOpen(true)}
        >
          {SGF_CATEGORIES.map((cat) => {
            const isActive = activeSection === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`portal-gnb-btn${isActive ? " active" : ""}`}
                onClick={() =>
                  handleCategoryClick(cat.id, cat.children[0] || "")
                }
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        <div className="portal-header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            type="button"
            className="ghost-btn pwa-btn"
            onClick={onInstallApp}
            title="앱으로 설치"
          >
            📲 {canInstallPwa ? "앱 설치" : "앱 안내"}
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => onOpenCommunityNotepad(null)}
          >
            📝 메모장
          </button>
          <button type="button" className="ghost-btn" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>

      {megaMenuOpen && (
        <div className="portal-mega-dropdown">
          <div className="portal-mega-inner">
            {SGF_CATEGORIES.map((cat) => (
              <div key={cat.id} className="portal-mega-col">
                <div className="portal-mega-col-title">{cat.label}</div>
                {cat.children.map((child) => {
                  const isSubActive =
                    activeSection === cat.id && activeSub === child;
                  return (
                    <button
                      key={child}
                      type="button"
                      className={`portal-mega-link${isSubActive ? " active" : ""}`}
                      onClick={() => handleCategoryClick(cat.id, child)}
                    >
                      {child}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
