export default function BrandLogo({ showSubtitle = false }) {
  return (
    <div className="brand" title="Sekwang Green Food (세광그린푸드)">
      <span className="sgf-badge" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.5 4.5C12.5 4.5 6.5 8.5 5.5 16.5C5.3 18 5.5 19.5 5.5 19.5C5.5 19.5 7 19.7 8.5 19.5C16.5 18.5 20.5 12.5 19.5 4.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 19.5C8.5 15.5 12 12 16.5 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
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
