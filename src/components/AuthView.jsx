import { useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import BrandLogo from "./BrandLogo";

export default function AuthView({ isDark, onToggleTheme }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user && !data.session) {
          setInfoMsg(
            "가입 확인 메일을 보냈습니다. 메일함에서 인증 링크를 누른 뒤 로그인해 주세요."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setErrorMsg(err.message || "인증 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb orb-1" aria-hidden="true" />
      <div className="auth-bg-orb orb-2" aria-hidden="true" />

      <div className="auth-card">
        <div className="auth-header">
          <BrandLogo showSubtitle />
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            aria-label="다크 모드 전환"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="auth-brand-slogan">
          오늘을 더 의미있게, 내일을 더 특별하게
        </div>

        {!isSupabaseConfigured ? (
          <div className="setup-guide">
            <h2>Supabase 연결 설정이 필요합니다</h2>
            <p>
              프로젝트 폴더의 <code>.env</code> 파일에 복사해 두신{" "}
              <strong>Project URL</strong>과 <strong>anon/publishable key</strong>를
              입력한 뒤 개발 서버를 다시 시작해 주세요.
            </p>
            <pre className="setup-code">
              {`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=복사한_키_붙여넣기`}
            </pre>
          </div>
        ) : (
          <>
            <p className="auth-subtitle">
              {isSignUp
                ? "새 계정을 만들면 PC와 스마트폰에서 메모가 동기화됩니다."
                : "로그인하여 클라우드에 저장된 메모를 불러오세요."}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-label">
                이메일
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="auth-label">
                비밀번호 (6자 이상)
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
              {infoMsg && <div className="auth-alert info">{infoMsg}</div>}

              <button
                type="submit"
                className="primary-btn auth-submit"
                disabled={loading}
              >
                {loading
                  ? "처리 중..."
                  : isSignUp
                    ? "이메일로 회원가입"
                    : "로그인"}
              </button>
            </form>

            <div className="auth-switch">
              {isSignUp ? "이미 계정이 있으신가요?" : "처음이신가요?"}{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsSignUp((prev) => !prev);
                  setErrorMsg("");
                  setInfoMsg("");
                }}
              >
                {isSignUp ? "로그인하기" : "회원가입하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
