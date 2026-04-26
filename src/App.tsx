import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import type { Book, CategoryItem } from "./types";
import {
  ensureSeeded,
  listBooks,
  listDownloadedIds,
  getFavorites,
  toggleFavorite,
  deleteBook,
  downloadPdfFromUrl,
  getPdfBlob,
  listCategories,
  addCategory,
  deleteCategory,
} from "./storage";
import { PdfReader } from "./components/PdfReader";
import { UploadModal } from "./components/UploadModal";
import { LoginModal } from "./components/LoginModal";
import { BookCard } from "./components/BookCard";

type View = "home" | "favorites" | "downloads";
type Theme = "dark" | "light";
type Toast = { msg: string; kind: "ok" | "err" | "info"; id: number };

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("mka:theme") as Theme) || "dark",
  );
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem("mka:isAdmin") === "1",
  );
  const [view, setView] = useState<View>("home");
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [reader, setReader] = useState<{ book: Book; blob: Blob } | null>(null);
  const [downloading, setDownloading] = useState<
    Record<string, { loaded: number; total: number }>
  >({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const toastIdRef = useRef(0);

  function toast(msg: string, kind: "ok" | "err" | "info" = "info") {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { msg, kind, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mka:theme", theme);
  }, [theme]);

  useEffect(() => {
    function on() {
      setIsOnline(true);
    }
    function off() {
      setIsOnline(false);
    }
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function refresh() {
    const [b, f, d, c] = await Promise.all([
      listBooks(),
      getFavorites(),
      listDownloadedIds(),
      listCategories(),
    ]);
    setBooks(b);
    setFavorites(f);
    setDownloadedIds(new Set(d));
    setCategories(c);
  }

  useEffect(() => {
    (async () => {
      try {
        await ensureSeeded();
        await refresh();
      } catch (e) {
        console.error(e);
        toast("تعذر تحميل المكتبة", "err");
      } finally {
        setLoading(false);
      }
    })();
    const id = setInterval(() => {
      refresh().catch(() => undefined);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let list = books;
    if (view === "favorites") list = list.filter((b) => favorites.includes(b.id));
    if (view === "downloads") list = list.filter((b) => downloadedIds.has(b.id));
    if (activeCat !== "all") list = list.filter((b) => b.category === activeCat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q));
    }
    return list;
  }, [books, view, favorites, downloadedIds, activeCat, search]);

  async function onToggleFav(id: string) {
    const next = await toggleFavorite(id);
    setFavorites(next);
  }

  async function onOpen(book: Book) {
    try {
      let blob = await getPdfBlob(book.id);
      if (!blob && book.pdfUrl) {
        toast("جاري تحضير الكتاب...", "info");
        await downloadPdfFromUrl(book, (loaded, total) => {
          setDownloading((d) => ({ ...d, [book.id]: { loaded, total } }));
        });
        setDownloading((d) => {
          const { [book.id]: _omit, ...rest } = d;
          void _omit;
          return rest;
        });
        blob = await getPdfBlob(book.id);
        await refresh();
      }
      if (!blob) {
        toast("الملف غير متوفر", "err");
        return;
      }
      setReader({ book, blob });
    } catch (err) {
      console.error(err);
      toast("تعذر فتح الكتاب", "err");
    }
  }

  async function onDownload(book: Book) {
    if (!book.pdfUrl) return toast("لا يوجد رابط لهذا الكتاب", "err");
    try {
      setDownloading((d) => ({ ...d, [book.id]: { loaded: 0, total: 1 } }));
      await downloadPdfFromUrl(book, (loaded, total) => {
        setDownloading((d) => ({ ...d, [book.id]: { loaded, total } }));
      });
      setDownloading((d) => {
        const { [book.id]: _omit, ...rest } = d;
        void _omit;
        return rest;
      });
      toast("تم حفظ الكتاب على الجهاز", "ok");
      await refresh();
    } catch (err) {
      console.error(err);
      setDownloading((d) => {
        const { [book.id]: _omit, ...rest } = d;
        void _omit;
        return rest;
      });
      toast("فشل تحميل الكتاب", "err");
    }
  }

  async function onDelete(book: Book) {
    if (!confirm(`حذف "${book.title}" نهائيًا؟`)) return;
    try {
      await deleteBook(book.id);
      toast("تم حذف الكتاب", "ok");
      await refresh();
    } catch {
      toast("تعذر الحذف", "err");
    }
  }

  async function onAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return toast("اكتب اسم القسم", "err");
    try {
      await addCategory(name);
      toast("تمت إضافة القسم", "ok");
      setNewCatName("");
      setShowAddCat(false);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "تعذر الإضافة", "err");
    }
  }

  async function onDeleteCategory(cat: CategoryItem) {
    if (!cat.custom) return;
    const used = books.some((b) => b.category === cat.id);
    if (used)
      return toast("لا يمكن حذف قسم به كتب — احذف الكتب أولاً", "err");
    if (!confirm(`حذف قسم "${cat.name}"؟`)) return;
    try {
      await deleteCategory(cat.id);
      toast("تم حذف القسم", "ok");
      if (activeCat === cat.id) setActiveCat("all");
      await refresh();
    } catch {
      toast("تعذر الحذف", "err");
    }
  }

  function logout() {
    localStorage.removeItem("mka:isAdmin");
    setIsAdmin(false);
    toast("تم تسجيل الخروج", "info");
  }

  const stats = {
    total: books.length,
    saved: downloadedIds.size,
    favs: favorites.length,
  };

  const allChips = [{ id: "all", name: "الكل" } as CategoryItem, ...categories];
  const logoSrc = `${import.meta.env.BASE_URL}12.png`;

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <header
        style={{
          background: "var(--header-bg)",
          borderBottom: "1px solid var(--line)",
          padding: "16px 18px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div className="logo-circle">
            <img src={logoSrc} alt="شعار المكتبة" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              className="font-kufi gold-text"
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              مكتبة الألحان
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--ink-soft)",
                fontFamily: "Amiri, serif",
              }}
            >
              كتب وألحان الكنيسة القبطية الأرثوذكسية
            </p>
          </div>
          {!isOnline && (
            <span
              title="أنت غير متصل بالإنترنت"
              style={{
                background: "rgba(192, 57, 43, 0.18)",
                color: "#ffb1a3",
                border: "1px solid rgba(192, 57, 43, 0.5)",
                padding: "6px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontFamily: "Reem Kufi, serif",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              ⚡ بدون إنترنت
            </span>
          )}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="تبديل المظهر"
            style={{
              background: "var(--surface-elev)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              width: 42,
              height: 42,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={logout}
              className="btn btn-dark"
              style={{ flex: "0 0 auto", padding: "10px 14px" }}
            >
              خروج
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="btn btn-dark"
              style={{ flex: "0 0 auto", padding: "10px 14px" }}
            >
              دخول
            </button>
          )}
        </div>
        <div className="gold-bar" style={{ marginTop: 14 }} />
      </header>

      <section
        style={{
          background: "var(--hero-grad)",
          padding: "40px 18px 32px",
          color: "#fff8d8",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${logoSrc}")`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            opacity: 0.07,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 38,
              color: "var(--gold-3)",
              marginBottom: 8,
              filter: "drop-shadow(0 0 20px var(--pattern-color))",
            }}
          >
            ✚
          </div>
          <h2
            className="font-kufi"
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(24px, 5vw, 36px)",
              fontWeight: 700,
              color: "#fff8d8",
            }}
          >
            مرحبًا بك في مكتبتك الكنسية
          </h2>
          <p
            className="font-amiri"
            style={{
              margin: "0 auto 24px",
              fontSize: "clamp(14px, 3vw, 16px)",
              opacity: 0.9,
              maxWidth: 600,
              lineHeight: 1.8,
            }}
          >
            اقرأ، احفظ، وشارك أجمل ألحان وكتب الكنيسة في أي وقت ومن أي مكان
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            <div className="stat-tile" style={{ padding: 14 }}>
              <div
                className="font-kufi"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--gold-3)",
                }}
              >
                {stats.total}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>كتاب</div>
            </div>
            <div className="stat-tile" style={{ padding: 14 }}>
              <div
                className="font-kufi"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--gold-3)",
                }}
              >
                {stats.saved}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>محفوظ</div>
            </div>
            <div className="stat-tile" style={{ padding: 14 }}>
              <div
                className="font-kufi"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--gold-3)",
                }}
              >
                {stats.favs}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>مفضلة</div>
            </div>
          </div>
        </div>
      </section>

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "26px 16px 24px",
        }}
      >
        <div style={{ position: "relative", marginBottom: 18 }}>
          <input
            className="search-input"
            type="search"
            placeholder="ابحث عن كتاب أو لحن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span
            style={{
              position: "absolute",
              left: 22,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--gold-2)",
              fontSize: 22,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
        </div>

        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 6,
            marginBottom: 22,
            alignItems: "center",
          }}
        >
          {allChips.map((c) => (
            <div
              key={c.id}
              style={{
                position: "relative",
                display: "inline-flex",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                className={`chip ${activeCat === c.id ? "active" : ""}`}
                onClick={() => setActiveCat(c.id)}
              >
                {c.name}
                {c.custom ? (
                  <span style={{ opacity: 0.7, marginInlineStart: 4 }}>✦</span>
                ) : null}
              </button>
              {isAdmin && c.custom && (
                <button
                  type="button"
                  className="cat-del-btn"
                  onClick={() => onDeleteCategory(c)}
                  aria-label={`حذف القسم ${c.name}`}
                  title="حذف القسم"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {isAdmin && (
            <button
              type="button"
              className="chip"
              style={{
                borderStyle: "dashed",
                color: "var(--gold-2)",
                borderColor: "var(--gold-deep)",
              }}
              onClick={() => setShowAddCat(true)}
            >
              ✚ قسم جديد
            </button>
          )}
        </div>

        {isAdmin && view === "home" && (
          <div style={{ marginBottom: 18 }}>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setShowUpload(true)}
              style={{ width: "100%", padding: "14px", fontSize: 15 }}
            >
              ✚ إضافة كتاب جديد
            </button>
          </div>
        )}

        <h3
          className="font-kufi"
          style={{
            margin: "0 0 16px",
            fontSize: 18,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "var(--gold-2)" }}>✚</span>
          {view === "home" && "كل الكتب"}
          {view === "favorites" && "المفضلة"}
          {view === "downloads" && "المحفوظة في الجهاز"}
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              marginInlineStart: "auto",
              fontFamily: "Reem Kufi, serif",
              fontWeight: 500,
            }}
          >
            {filtered.length} كتاب
          </span>
        </h3>

        {loading ? (
          <div style={{ display: "grid", placeItems: "center", padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "var(--ink-soft)",
              border: "2px dashed var(--line-2)",
              borderRadius: 18,
              background: "var(--surface-2)",
            }}
          >
            <div
              style={{
                fontSize: 50,
                color: "var(--gold-2)",
                marginBottom: 12,
                opacity: 0.7,
              }}
            >
              ✚
            </div>
            <h4
              className="font-kufi"
              style={{ margin: "0 0 6px", color: "var(--ink)" }}
            >
              لا توجد كتب لعرضها
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontFamily: "Reem Kufi, serif",
              }}
            >
              {view === "home"
                ? isAdmin
                  ? "اضغط على «إضافة كتاب جديد» لرفع أول كتاب"
                  : "لم يتم إضافة أي كتب بعد"
                : view === "favorites"
                  ? "لم تقم بإضافة أي كتاب إلى المفضلة"
                  : "لم تقم بحفظ أي كتاب بعد"}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: 14,
            }}
          >
            {filtered.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                isFavorite={favorites.includes(b.id)}
                isDownloaded={downloadedIds.has(b.id)}
                isAdmin={isAdmin}
                downloading={downloading[b.id] || null}
                onToggleFav={onToggleFav}
                onOpen={onOpen}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </main>

      <nav className="nav-bar">
        <button
          type="button"
          className={view === "home" ? "active" : ""}
          onClick={() => setView("home")}
        >
          <span style={{ fontSize: 18 }}>🏠</span>
          الرئيسية
        </button>
        <button
          type="button"
          className={view === "favorites" ? "active" : ""}
          onClick={() => setView("favorites")}
        >
          <span style={{ fontSize: 18 }}>★</span>
          المفضلة
        </button>
        <button
          type="button"
          className={view === "downloads" ? "active" : ""}
          onClick={() => setView("downloads")}
        >
          <span style={{ fontSize: 18 }}>📚</span>
          محفوظاتي
        </button>
      </nav>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={() => setIsAdmin(true)}
          toast={toast}
        />
      )}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onAdded={refresh}
          toast={toast}
        />
      )}
      {showAddCat && (
        <div
          className="modal-backdrop"
          onClick={(e) =>
            e.target === e.currentTarget && setShowAddCat(false)
          }
        >
          <form
            className="modal-card"
            style={{ maxWidth: 420 }}
            onSubmit={onAddCategory}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowAddCat(false)}
              aria-label="إغلاق"
            >
              ✕
            </button>
            <h3 className="modal-title">
              <span style={{ color: "var(--gold-2)" }}>✚</span>
              إضافة قسم جديد
            </h3>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">اسم القسم</label>
              <input
                className="text-input"
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="مثال: ميامر وعظات"
                autoFocus
              />
              <small
                style={{
                  display: "block",
                  marginTop: 8,
                  color: "var(--ink-mute)",
                  fontSize: 12,
                  fontFamily: "Reem Kufi, serif",
                }}
              >
                هيظهر في شريط الأقسام مع علامة ✦ ويمكنك حذفه لاحقًا.
              </small>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                className="btn btn-gold"
                style={{ flex: 1, padding: "12px 18px", fontSize: 14 }}
              >
                حفظ القسم
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setShowAddCat(false)}
                style={{ flex: 0.5, padding: "12px 18px", fontSize: 14 }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
      {reader && (
        <PdfReader
          book={reader.book}
          blob={reader.blob}
          onClose={() => setReader(null)}
        />
      )}

      {toasts.map((t, i) => (
        <div
          key={t.id}
          className={`toast ${t.kind}`}
          style={{ bottom: 110 + i * 56 }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
