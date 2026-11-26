import BrandLogo from "./BrandLogo";

export default function InstallAppModal({ onClose, onTriggerInstall, canInstallPwa }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card install-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="SGF 메모장 앱 설치 안내"
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandLogo showSubtitle={false} />
            <div>
              <h3>SGF 메모장을 전용 어플(App)로 설치하기</h3>
              <p className="modal-subtitle">
                브라우저 주소창 없이 독립된 PC 프로그램·스마트폰 어플처럼 실행됩니다.
              </p>
            </div>
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

        {canInstallPwa && (
          <div className="install-direct-box">
            <div>
              <strong>현재 브라우저에서 원클릭 앱 설치가 가능합니다!</strong>
              <p>아래 버튼을 누르면 바탕화면 및 작업표시줄에 SGF 메모장 앱이 생성됩니다.</p>
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={onTriggerInstall}
            >
              📲 지금 바로 앱 설치하기
            </button>
          </div>
        )}

        <div className="install-steps-grid">
          <div className="install-step-card">
            <span className="step-badge">PC (Chrome / Edge / Aside)</span>
            <h4>데스크톱 전용 프로그램으로 설치</h4>
            <ol>
              <li>
                브라우저 우측 상단 주소창 오른쪽 끝의{" "}
                <strong>[앱 설치 (모니터+화살표 아이콘)]</strong>를 클릭하거나,
              </li>
              <li>
                우측 상단 메뉴(<strong>⋮</strong>) →{" "}
                <strong>[캐스트, 저장, 공유]</strong> →{" "}
                <strong>[페이지를 앱으로 설치...]</strong>를 클릭합니다.
              </li>
              <li>
                바탕화면과 시작 메뉴에 <strong>SGF 메모장</strong> 아이콘이 생성되어
                일반 프로그램처럼 독립 창으로 실행됩니다.
              </li>
            </ol>
          </div>

          <div className="install-step-card">
            <span className="step-badge">스마트폰 (iPhone / Android)</span>
            <h4>스마트폰 홈 화면에 어플로 추가</h4>
            <ol>
              <li>
                <strong>아이폰(Safari)</strong>: 하단 중앙의{" "}
                <strong>[공유(네모+위화살표)]</strong> 버튼을 누른 뒤{" "}
                <strong>[홈 화면에 추가]</strong>를 선택합니다.
              </li>
              <li>
                <strong>갤럭시(Chrome)</strong>: 우측 상단 메뉴(<strong>⋮</strong>)를
                누른 뒤 <strong>[홈 화면에 추가]</strong> 또는{" "}
                <strong>[앱 설치]</strong>를 선택합니다.
              </li>
              <li>
                홈 화면에 SGF 아이콘이 생성되며, 전체 화면 어플로 즉시 실행됩니다.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
