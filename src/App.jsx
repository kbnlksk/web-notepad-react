import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import AuthView from "./components/AuthView";
import HomeDashboard from "./components/HomeDashboard";
import PortalSectionView from "./components/PortalSectionView";
import ShareModal, {
  SharedNoteViewer,
  decodeSharedNote,
} from "./components/ShareModal";
import InstallAppModal from "./components/InstallAppModal";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import {
  THEME_STORAGE_KEY,
  createWelcomeNotePayload,
  formatCategoryValue,
  normalizeTag,
  parseCategory,
  stripHtml,
} from "./utils/noteHelpers";

function loadInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved) return saved === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function mapDbNote(row) {
  return {
    id: row.id,
    title: row.title || "",
    body: row.body || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    category: row.category || "COMMUNITY",
    pinned: Boolean(row.pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isDark, setIsDark] = useState(loadInitialTheme);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [saveStatus, setSaveStatus] = useState("클라우드 동기화됨");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState("dashboard"); // "dashboard" | "portal" | "community"
  const [portalSection, setPortalSection] = useState("COMPANY");
  const [portalSub, setPortalSub] = useState("기업소개");
  const [shareTargetNote, setShareTargetNote] = useState(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState(null);
  const [sharedNoteFromUrl, setSharedNoteFromUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("share");
    return encoded ? decodeSharedNote(encoded) : null;
  });

  const saveTimersRef = useRef({});

  // PWA 설치 이벤트(beforeinstallprompt) 캡처
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // 다크 모드 동기화
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  // Supabase 인증 세션 구독
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그인된 사용자의 메모 불러오기
  const fetchNotes = useCallback(async (userId) => {
    if (!supabase || !userId) return;
    setNotesLoading(true);

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("fetchNotes error:", error);
      setSaveStatus(`불러오기 오류: ${error.message}`);
      setNotesLoading(false);
      return;
    }

    if (data) {
      if (data.length === 0) {
        const welcome = createWelcomeNotePayload();
        const { data: inserted, error: insertError } = await supabase
          .from("notes")
          .insert({ ...welcome, user_id: userId })
          .select()
          .single();

        if (insertError) {
          console.error("welcome insert error:", insertError);
          setSaveStatus(`초기 메모 생성 오류: ${insertError.message}`);
        } else if (inserted) {
          const mapped = mapDbNote(inserted);
          setNotes([mapped]);
          setActiveNoteId(mapped.id);
        }
      } else {
        const mapped = data.map(mapDbNote);
        setNotes(mapped);
        setActiveNoteId((prev) =>
          mapped.some((n) => n.id === prev) ? prev : mapped[0]?.id ?? null
        );
      }
    }
    setNotesLoading(false);
  }, []);

  // 로그인 시 메모 로드 + 실시간 동기화 구독
  useEffect(() => {
    const userId = session?.user?.id;
    if (!supabase || !userId) {
      setNotes([]);
      setActiveNoteId(null);
      return;
    }

    fetchNotes(userId);

    const channel = supabase
      .channel(`notes-sync-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = mapDbNote(payload.new);
            setNotes((prev) =>
              prev.some((n) => n.id === incoming.id) ? prev : [incoming, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            const incoming = mapDbNote(payload.new);
            // 현재 입력 디바운스 중인 노트는 덮어쓰지 않음
            if (!saveTimersRef.current[incoming.id]) {
              setNotes((prev) =>
                prev.map((n) => (n.id === incoming.id ? incoming : n))
              );
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setNotes((prev) => prev.filter((n) => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, fetchNotes]);

  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes
      .filter((note) => {
        const { main, sub } = parseCategory(note.category);
        if (activeCategory !== "ALL" && main !== activeCategory) {
          return false;
        }
        if (activeSubCategory && sub !== activeSubCategory) {
          return false;
        }
        if (activeTagFilter && !(note.tags || []).includes(activeTagFilter)) {
          return false;
        }
        if (!q) return true;
        const tagsText = (note.tags || []).join(" ").toLowerCase();
        const plainBody = stripHtml(note.body).toLowerCase();
        return (
          note.title.toLowerCase().includes(q) ||
          plainBody.includes(q) ||
          tagsText.includes(q) ||
          (note.category || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }, [notes, searchQuery, activeTagFilter, activeCategory, activeSubCategory]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || null,
    [notes, activeNoteId]
  );

  const persistPatchToDb = useCallback((noteId, patch) => {
    if (!supabase) return;
    setSaveStatus("동기화 중...");

    if (saveTimersRef.current[noteId]) {
      clearTimeout(saveTimersRef.current[noteId]);
    }

    saveTimersRef.current[noteId] = setTimeout(async () => {
      const { error } = await supabase
        .from("notes")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId);

      delete saveTimersRef.current[noteId];
      setSaveStatus(error ? "저장 오류 (재시도 필요)" : "클라우드 동기화됨");
    }, 350);
  }, []);

  const handleCreateNote = async () => {
    if (!supabase || !session?.user?.id) {
      alert("로그인 세션을 확인할 수 없습니다. 새로고침 후 다시 로그인해 주세요.");
      return;
    }
    setSaveStatus("새 메모 생성 중...");

    const initialTags = activeTagFilter ? [activeTagFilter] : [];
    const initialCategory = formatCategoryValue(
      activeCategory !== "ALL" ? activeCategory : "COMMUNITY",
      activeSubCategory || ""
    );
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: session.user.id,
        title: "",
        body: "",
        tags: initialTags,
        category: initialCategory,
        pinned: false,
      })
      .select()
      .single();

    if (error) {
      console.error("createNote error:", error);
      setSaveStatus(`생성 오류: ${error.message}`);
      alert(`새 메모 생성 실패: ${error.message}`);
      return;
    }

    if (data) {
      const created = mapDbNote(data);
      setNotes((prev) =>
        prev.some((n) => n.id === created.id) ? prev : [created, ...prev]
      );
      setActiveNoteId(created.id);
      setViewMode("community");
      setSearchQuery("");
      setSidebarOpen(false);
      setSaveStatus("클라우드 동기화됨");
    }
  };

  const handleQuickCreateNote = async ({ title, body, tags, category }) => {
    if (!supabase || !session?.user?.id) return;
    setSaveStatus("빠른 메모 저장 중...");
    const targetCategory =
      category ||
      formatCategoryValue(
        activeCategory !== "ALL" ? activeCategory : "COMMUNITY",
        activeSubCategory || ""
      );
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: session.user.id,
        title: title || "",
        body: body || "",
        tags: Array.isArray(tags) ? tags : [],
        category: targetCategory,
        pinned: false,
      })
      .select()
      .single();

    if (!error && data) {
      const created = mapDbNote(data);
      setNotes((prev) =>
        prev.some((n) => n.id === created.id) ? prev : [created, ...prev]
      );
      setActiveNoteId(created.id);
      setSaveStatus("클라우드 동기화됨");
    }
  };

  const handleTogglePinByNote = (targetNote) => {
    if (!targetNote) return;
    const nextPinned = !targetNote.pinned;
    const nowIso = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === targetNote.id
          ? { ...n, pinned: nextPinned, updatedAt: nowIso }
          : n
      )
    );
    persistPatchToDb(targetNote.id, { pinned: nextPinned });
  };

  const handleInstallAppClick = async () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      const choice = await deferredPwaPrompt.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        setDeferredPwaPrompt(null);
        return;
      }
    }
    setInstallModalOpen(true);
  };

  const handleImportSharedNote = async (shared) => {
    if (!supabase || !session?.user?.id) {
      alert("로그인 후 내 메모장에 저장할 수 있습니다.");
      setSharedNoteFromUrl(null);
      return;
    }
    await handleQuickCreateNote({
      title: `[공유] ${shared.title || "제목 없음"}`,
      body: shared.body || "",
      tags: shared.tags || [],
    });
    window.history.replaceState({}, "", window.location.pathname);
    setSharedNoteFromUrl(null);
    setViewMode("editor");
  };

  const handleUpdateNote = (patch) => {
    if (!activeNoteId) return;
    const nowIso = new Date().toISOString();

    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId
          ? { ...note, ...patch, updatedAt: nowIso }
          : note
      )
    );
    persistPatchToDb(activeNoteId, patch);
  };

  const handleAddTag = (rawTag) => {
    const tag = normalizeTag(rawTag);
    if (!tag || !activeNote) return;
    const currentTags = activeNote.tags || [];
    if (currentTags.includes(tag)) return;
    handleUpdateNote({ tags: [...currentTags, tag] });
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!activeNote) return;
    const nextTags = (activeNote.tags || []).filter((t) => t !== tagToRemove);
    handleUpdateNote({ tags: nextTags });
    if (activeTagFilter === tagToRemove) {
      const stillExistsElsewhere = notes.some(
        (n) => n.id !== activeNote.id && (n.tags || []).includes(tagToRemove)
      );
      if (!stillExistsElsewhere) setActiveTagFilter(null);
    }
  };

  const handleTogglePin = () => {
    if (!activeNote) return;
    handleUpdateNote({ pinned: !activeNote.pinned });
  };

  const handleAddAttachment = (attachment) => {
    if (!activeNote) return;
    const current = activeNote.attachments || [];
    handleUpdateNote({ attachments: [...current, attachment] });
  };

  const handleRemoveAttachment = (urlToRemove) => {
    if (!activeNote) return;
    const next = (activeNote.attachments || []).filter(
      (att) => att.url !== urlToRemove
    );
    handleUpdateNote({ attachments: next });
  };

  const handleDeleteNote = async () => {
    if (!activeNote || !supabase) return;
    const displayTitle = activeNote.title.trim() || "제목 없음";
    if (!window.confirm(`"${displayTitle}" 메모를 삭제할까요?`)) return;

    const targetId = activeNote.id;
    const remaining = notes.filter((n) => n.id !== targetId);
    setNotes(remaining);
    setActiveNoteId(remaining[0]?.id ?? null);

    await supabase.from("notes").delete().eq("id", targetId);
  };

  const handleDownloadNote = () => {
    if (!activeNote) return;
    const titleText = activeNote.title.trim() || "제목 없음";
    const tagsLine =
      activeNote.tags && activeNote.tags.length > 0
        ? `태그: ${activeNote.tags.join(" ")}\n`
        : "";
    const plainText = stripHtml(activeNote.body);
    const content = `${titleText}\n${tagsLine}${"=".repeat(24)}\n\n${plainText}`;

    const safeName = titleText.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName || "메모"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (sharedNoteFromUrl) {
    return (
      <SharedNoteViewer
        sharedNote={sharedNoteFromUrl}
        onCloseShared={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setSharedNoteFromUrl(null);
        }}
        onImportShared={session?.user?.id ? handleImportSharedNote : null}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">불러오는 중...</div>
      </div>
    );
  }

  if (!isSupabaseConfigured || !session) {
    return (
      <AuthView
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />
    );
  }

  const handleNavigateSection = (section, sub = "") => {
    setPortalSection(section);
    setPortalSub(sub);
    setViewMode("portal");
  };

  const handleOpenCommunityNotepad = (sub = null) => {
    setActiveCategory("ALL");
    setActiveSubCategory(sub);
    setViewMode("community");
    setSidebarOpen(false);
  };

  return (
    <>
      {viewMode === "dashboard" && (
        <HomeDashboard
          notes={notes}
          userEmail={session.user.email}
          isDark={isDark}
          canInstallPwa={Boolean(deferredPwaPrompt)}
          onNavigateSection={handleNavigateSection}
          onOpenCommunityNotepad={handleOpenCommunityNotepad}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            setViewMode("community");
          }}
          onCreateNote={handleCreateNote}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onInstallApp={handleInstallAppClick}
          onLogout={handleLogout}
        />
      )}

      {viewMode === "portal" && (
        <PortalSectionView
          section={portalSection}
          subSection={portalSub}
          isDark={isDark}
          canInstallPwa={Boolean(deferredPwaPrompt)}
          onGoHome={() => setViewMode("dashboard")}
          onNavigateSection={handleNavigateSection}
          onOpenCommunityNotepad={handleOpenCommunityNotepad}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onInstallApp={handleInstallAppClick}
          onLogout={handleLogout}
        />
      )}

      {viewMode === "community" && (
        <div className="app">
          <Sidebar
            isOpen={sidebarOpen}
            isDark={isDark}
            userEmail={session.user.email}
            onLogout={handleLogout}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            onCreateNote={handleCreateNote}
            viewMode="editor"
            onOpenDashboard={() => {
              setViewMode("dashboard");
              setSidebarOpen(false);
            }}
            onInstallApp={handleInstallAppClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allTags={allTags}
            activeTagFilter={activeTagFilter}
            onSelectTagFilter={setActiveTagFilter}
            activeCategory={activeCategory}
            onSelectCategory={(cat, sub = null) => {
              setActiveCategory(cat);
              setActiveSubCategory(sub);
            }}
            activeSubCategory={activeSubCategory}
            onSelectSubCategory={setActiveSubCategory}
            notes={filteredNotes}
            totalCount={notes.length}
            activeNoteId={activeNoteId}
            onSelectNote={(id) => {
              setActiveNoteId(id);
              setSidebarOpen(false);
            }}
          />

          <Editor
            note={activeNote}
            userId={session.user.id}
            saveStatus={notesLoading ? "메모 불러오는 중..." : saveStatus}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onOpenDashboard={() => setViewMode("dashboard")}
            onOpenShare={(note) => setShareTargetNote(note)}
            onUpdateNote={handleUpdateNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            onTogglePin={handleTogglePin}
            onDeleteNote={handleDeleteNote}
            onDownloadNote={handleDownloadNote}
            onCreateNote={handleCreateNote}
          />
        </div>
      )}

      {shareTargetNote && (
        <ShareModal
          note={shareTargetNote}
          onClose={() => setShareTargetNote(null)}
          onDownloadTxt={handleDownloadNote}
        />
      )}

      {installModalOpen && (
        <InstallAppModal
          onClose={() => setInstallModalOpen(false)}
          onTriggerInstall={handleInstallAppClick}
          canInstallPwa={Boolean(deferredPwaPrompt)}
        />
      )}
    </>
  );
}
