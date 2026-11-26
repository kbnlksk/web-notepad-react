export default function BrandLogo({ showSubtitle = true }) {
  return (
    <div className="brand" title="Sekwang Green Food (세광그린푸드)">
      <span className="sgf-symbol" aria-hidden="true">
        <svg
          width="30"
          height="30"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 큰 우상향 곡선 스우시 */}
          <path
            d="M5 25.5C9.5 14.5 18.5 8.5 31 6.5C23.5 11.5 17.5 17.5 13 26.5C10.5 26.8 7.5 26.4 5 25.5Z"
            fill="currentColor"
          />
          {/* 작은 보조 곡선 스우시 */}
          <path
            d="M15.5 28.5C19 20.5 24.5 15.5 31.5 13.5C27.5 17.5 24 22 21.5 28.5C19.5 29 17.5 29 15.5 28.5Z"
            fill="currentColor"
            opacity="0.72"
          />
        </svg>
      </span>
      <div className="brand-text">
        <span className="brand-sgf">SGF</span>
        {showSubtitle && (
          <span className="brand-sub">Sekwang Green Food</span>
        )}
      </div>
    </div>
  );
}
