import { useEffect, useState } from "react";
import type { Book, BookCategory, CategoryId } from "./types";
import { CATEGORIES } from "./types";

/* ============== Cover ============== */
export function CoverArt({ book }: { book: Book }) {
  const [errored, setErrored] = useState(false);
  if (book.image && !errored) {
    return (
      <img
        src={book.image}
        alt={book.title}
        loading="lazy"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-[#f5e7be] p-3 text-center">
      <div className="font-amiri font-bold text-sm leading-snug line-clamp-4">
        {book.title}
      </div>
    </div>
  );
}

/* ============== Book Card ============== */
export function BookCard({
  book,
  isFavorite,
  isDownloaded,
  isDownloading,
  progress,
  onOpen,
  onToggleFav,
  onDownload,
  onDelete,
  onDeleteDownload,
  isAdmin,
}: {
  book: Book;
  isFavorite: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  progress: number;
  onOpen: () => void;
  onToggleFav: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  onDeleteDownload?: () => void;
  isAdmin: boolean;
}) {
  return (
    <div className="book mka-fade-up">
      <div className="book-cover" onClick={onOpen}>
        <CoverArt book={book} />
        <span className="book-cover-overlay" />
        <span className="cat-pill">{book.category}</span>
        <button
          type="button"
          className={`fav-btn ${isFavorite ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          aria-label="مفضلة"
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <h3
        className="font-amiri m-0 mb-2 text-[15px] font-bold leading-snug line-clamp-2"
        style={{ color: "var(--ink)", minHeight: "2.6em" }}
      >
        {book.title}
      </h3>

      {isDownloading && (
        <div className="progress-track mb-2">
          <span style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }} />
        </div>
      )}

      <div className="flex gap-1.5 mt-auto flex-wrap">
        <button type="button" className="btn btn-gold" onClick={onOpen}>
          {isDownloaded ? "📖 قراءة" : "👁 معاينة"}
        </button>
        {!isDownloaded ? (
          <button
            type="button"
            className="btn btn-dark"
            onClick={onDownload}
            disabled={isDownloading}
          >
            {isDownloading ? "..." : "⬇ تحميل"}
          </button>
        ) : onDeleteDownload ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onDeleteDownload}
            aria-label="حذف من المحمّلة"
          >
            🗑
          </button>
        ) : null}
        {isAdmin && onDelete && !book.isSeed && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onDelete}
            aria-label="حذف الكتاب"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/* ============== Header ============== */
export function Header({
  isAdmin,
  isOnline,
  theme,
  onToggleTheme,
  onLogin,
  onLogout,
  onAddBook,
}: {
  isAdmin: boolean;
  isOnline: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onAddBook: () => void;
}) {
  return (
    <>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--header-bg)",
          borderBottom: "1px solid var(--line)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 4px 24px -12px rgba(0,0,0,.5)",
        }}
      >
        <div className="max-w-[1300px] mx-auto px-4 sm:px-5 py-3.5 flex items-center gap-3 sm:gap-4">
          <div className="logo-circle">
            <CrossSvg />
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="font-kufi m-0 text-[18px] sm:text-[22px] font-bold tracking-wide truncate"
              style={{ color: "var(--ink)" }}
            >
              مكتبة <span className="gold-text">الألحان</span>
            </h1>
            <div
              className="font-kufi text-[11px] sm:text-[12.5px] mt-1 font-semibold truncate"
              style={{ color: "var(--ink-soft)", letterSpacing: "1.2px" }}
            >
              <span style={{ color: "var(--gold)" }}>❖</span>{" "}
              كنيسة السيدة العذراء مريم والقديس يوسف النجار{" "}
              <span style={{ color: "var(--gold)" }}>❖</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
              style={{
                background: isOnline ? "rgba(80,200,120,.12)" : "rgba(255,138,138,.12)",
                color: isOnline ? "#7ed99a" : "#ff9a9a",
                border: `1px solid ${isOnline ? "rgba(80,200,120,.3)" : "rgba(255,138,138,.3)"}`,
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: isOnline ? "#7ed99a" : "#ff9a9a" }}
              />
              {isOnline ? "متصل" : "أوفلاين"}
            </span>

            {isAdmin && (
              <button
                type="button"
                onClick={onAddBook}
                className="hidden sm:inline-flex btn btn-gold !flex-none px-3"
              >
                + إضافة كتاب
              </button>
            )}

            {isAdmin ? (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs px-3 py-2 rounded-lg font-kufi font-bold"
                style={{
                  color: "var(--ink-soft)",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                }}
              >
                خروج
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="text-xs px-3 py-2 rounded-lg font-kufi font-bold"
                style={{
                  color: "var(--gold)",
                  border: "1px solid var(--gold)",
                  background: "var(--surface)",
                }}
              >
                دخول الأدمن
              </button>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              className="w-11 h-11 rounded-xl grid place-items-center cursor-pointer text-xl transition"
              style={{
                background: "var(--surface)",
                border: "1.5px solid var(--line)",
                color: "var(--ink)",
              }}
              aria-label="تبديل المظهر"
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
          </div>
        </div>
      </header>
      <div className="gold-bar" />
    </>
  );
}

function CrossSvg() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "relative", zIndex: 1 }}
    >
      <path
        d="M28 10h8v16h16v8H36v24h-8V34H12v-8h16z"
        fill="#0a1a36"
        stroke="#c9a449"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="30" r="4" fill="none" stroke="#c9a449" strokeWidth="1.2" />
    </svg>
  );
}

/* ============== Hero ============== */
export function Hero({
  total,
  catCount,
  downCount,
  favCount,
}: {
  total: number;
  catCount: number;
  downCount: number;
  favCount: number;
}) {
  return (
    <section
      className="relative text-center px-5 py-12 sm:py-16 overflow-hidden"
      style={{
        background: "var(--hero-grad)",
        color: "#f5e7be",
        borderBottom: "3px solid var(--gold-deep)",
      }}
    >
      <h2
        className="font-amiri m-0 mb-3 text-[30px] sm:text-[42px] font-bold leading-tight"
        style={{
          color: "#fff8e1",
          textShadow: "0 2px 12px rgba(0,0,0,.5)",
          letterSpacing: ".5px",
        }}
      >
        مكتبة <span className="gold-text">الألحان</span>
      </h2>

      <div
        className="mx-auto mb-4 relative"
        style={{
          width: 120,
          height: 2,
          background: "linear-gradient(90deg, transparent, var(--gold-2), transparent)",
        }}
      >
        <span
          className="absolute top-1/2 -left-1 w-2 h-2 rounded-full"
          style={{ background: "var(--gold-2)", transform: "translateY(-50%)", boxShadow: "0 0 12px var(--gold-2)" }}
        />
        <span
          className="absolute top-1/2 -right-1 w-2 h-2 rounded-full"
          style={{ background: "var(--gold-2)", transform: "translateY(-50%)", boxShadow: "0 0 12px var(--gold-2)" }}
        />
      </div>

      <p className="font-amiri max-w-[680px] mx-auto text-[15px] sm:text-base leading-loose" style={{ color: "#f3e7c0d8" }}>
        مكتبة الألحان تضم كتب الهزات وكتب المناسبات والروحيات
      </p>

      <div className="hero-verse max-w-[640px] mx-auto mt-6 px-7 py-5">
        <div className="font-amiri italic text-[16px] sm:text-[17px] leading-loose" style={{ color: "#fff5d4" }}>
          "طُوبَى لِلشَّعْبِ الْعَارِفِينَ الْهُتَافَ. يَا رَبُّ، بِنُورِ وَجْهِكَ يَسْلُكُونَ."
        </div>
        <div className="mt-2 text-[13px] font-bold tracking-widest" style={{ color: "var(--gold-2)" }}>
          (مز 89: 15)
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-7 max-w-[700px] mx-auto">
        <Stat n={total} label="كتاب متاح" />
        <Stat n={catCount} label="أقسام كتب" />
        <Stat n={downCount} label="محمّل عندك" />
        <Stat n={favCount} label="في المفضلة" />
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="stat-tile px-5 py-3 min-w-[120px]">
      <div className="gold-text text-[26px] sm:text-[28px] font-bold leading-none">
        {n}
      </div>
      <div
        className="font-kufi text-[12px] sm:text-[12.5px] font-semibold mt-1.5"
        style={{ color: "#f3e7c0bb", letterSpacing: ".8px" }}
      >
        {label}
      </div>
    </div>
  );
}

/* ============== Search & Chips ============== */
export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative max-w-[760px] mx-auto -mt-7 px-5 z-[5]">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
        placeholder="ابحث عن كتاب أو موضوع روحي..."
        aria-label="بحث"
      />
      <span
        className="absolute top-1/2 right-10 pointer-events-none text-2xl"
        style={{ color: "var(--gold)", transform: "translateY(-50%)" }}
      >
        ⌕
      </span>
    </div>
  );
}

export function CategoryChips({
  current,
  onChange,
  counts,
}: {
  current: CategoryId;
  onChange: (c: CategoryId) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="max-w-[1300px] mx-auto px-4 pt-4">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`chip ${current === c.id ? "active" : ""}`}
          >
            <span style={{ color: current === c.id ? "#0a1a36" : "var(--gold)" }}>✚</span>
            <span>{c.name}</span>
            <span
              className="text-[11px] opacity-80"
              style={{ marginInlineStart: 4 }}
            >
              {counts[c.id] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============== Section heading ============== */
export function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3 mt-7 mb-4 px-1">
      <h2
        className="font-kufi m-0 text-[20px] sm:text-[22px] font-bold flex items-center gap-3"
        style={{ color: "var(--ink)" }}
      >
        <span
          className="inline-block w-[6px] h-6 rounded-md"
          style={{
            background: "var(--gold-grad)",
            boxShadow: "0 0 10px var(--pattern-color)",
          }}
        />
        {title}
      </h2>
      <span
        className="font-kufi text-[13px] font-semibold px-4 py-1.5 rounded-full"
        style={{
          color: "var(--ink-soft)",
          background: "var(--surface)",
          border: "1px solid var(--line)",
        }}
      >
        {count} كتاب
      </span>
    </div>
  );
}

/* ============== Empty State ============== */
export function EmptyState({
  big,
  title,
  hint,
}: {
  big: string;
  title: string;
  hint: string;
}) {
  return (
    <div
      className="text-center py-14 px-4 my-2 rounded-2xl"
      style={{
        border: "2px dashed var(--line)",
        background: "var(--surface)",
        color: "var(--ink-soft)",
      }}
    >
      <div className="text-[54px] mb-3" style={{ color: "var(--gold)" }}>
        {big}
      </div>
      <div
        className="font-kufi font-bold text-lg mb-2"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </div>
      <div>{hint}</div>
    </div>
  );
}

/* ============== Bottom Nav ============== */
export type RouteId = "home" | "favorites" | "downloads";

export function BottomNav({
  current,
  onChange,
}: {
  current: RouteId;
  onChange: (r: RouteId) => void;
}) {
  const items: { id: RouteId; label: string; ic: string }[] = [
    { id: "home", label: "الرئيسية", ic: "⌂" },
    { id: "favorites", label: "المفضلة", ic: "★" },
    { id: "downloads", label: "المحمّلة", ic: "⬇" },
  ];
  return (
    <nav className="nav-bar">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={current === it.id ? "active" : ""}
        >
          <span className="text-[22px] leading-none">{it.ic}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ============== Modal ============== */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 mka-fade"
      style={{ background: "rgba(0,0,0,.65)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--gold)",
          boxShadow: "0 20px 60px rgba(0,0,0,.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <h2 className="font-kufi font-bold text-base" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-xl"
            style={{ color: "var(--ink-soft)", background: "transparent" }}
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ============== Toast ============== */
export function Toast({ message, kind }: { message: string; kind: "ok" | "err" | "info" }) {
  const palette = {
    ok: { bg: "var(--gold)", fg: "#0a1a36" },
    err: { bg: "var(--burgundy)", fg: "#fff" },
    info: { bg: "var(--surface-elev)", fg: "var(--ink)" },
  }[kind];
  return (
    <div
      className="fixed left-1/2 bottom-[104px] z-[400] px-6 py-3 rounded-full text-sm font-bold font-kufi mka-fade-up"
      style={{
        transform: "translateX(-50%)",
        background: palette.bg,
        color: palette.fg,
        boxShadow: "0 12px 30px -12px rgba(0,0,0,.6)",
      }}
    >
      {message}
    </div>
  );
}

/* ============== Text Field & Select ============== */
export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-kufi">
      <span style={{ color: "var(--ink-soft)" }}>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 rounded-lg outline-none font-amiri text-base"
        style={{
          background: "var(--bg-2)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
        }}
      />
    </label>
  );
}

export function CategorySelect({
  value,
  onChange,
}: {
  value: BookCategory;
  onChange: (v: BookCategory) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-kufi">
      <span style={{ color: "var(--ink-soft)" }}>القسم</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BookCategory)}
        className="px-3 py-2.5 rounded-lg outline-none font-kufi"
        style={{
          background: "var(--bg-2)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
        }}
      >
        {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
          <option key={c.id} value={c.id} style={{ background: "#0a1a36", color: "#f3e9c8" }}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ============== Footer ============== */
export function Footer() {
  return (
    <footer
      className="mt-12 mb-5 mx-4 sm:mx-6 px-5 py-9 rounded-2xl text-center"
      style={{
        background: "linear-gradient(180deg, transparent, var(--surface))",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div
        className="font-amiri italic text-[16px] sm:text-[17px] font-semibold max-w-[600px] mx-auto"
        style={{ color: "var(--ink)" }}
      >
        "فَتِّشُوا الْكُتُبَ لأَنَّكُمْ تَظُنُّونَ أَنَّ لَكُمْ فِيهَا حَيَاةً أَبَدِيَّةً.
        وَهِيَ الَّتِي تَشْهَدُ لِي."
      </div>
      <div className="mt-2 text-[13px] font-bold tracking-widest" style={{ color: "var(--gold)" }}>
        (يو 5: 39)
      </div>
      <div className="font-kufi mt-5 text-xs" style={{ color: "var(--ink-mute)" }}>
        © مكتبة الألحان — جميع المجد لله ✝
      </div>
    </footer>
  );
}

/* ============== Reader ============== */
export function PdfReader({
  book,
  url,
  onClose,
}: {
  book: Book;
  url: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col mka-fade"
      style={{ background: "var(--reader-bg)" }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: "var(--reader-header)",
          color: "#f5e7be",
          borderBottom: "2px solid var(--gold-deep)",
        }}
      >
        <div className="w-8 h-8 grid place-items-center shrink-0">
          <CrossSvg />
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className="font-amiri m-0 text-[15px] sm:text-base font-bold truncate"
            style={{ color: "#f5e7be" }}
          >
            {book.title}
          </h2>
          <span
            className="font-kufi text-[11px]"
            style={{ color: "var(--gold-2)" }}
          >
            {book.category}
          </span>
        </div>
        <a
          href={url}
          download={`${book.title}.pdf`}
          className="font-kufi text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-lg"
          style={{
            background: "var(--gold-grad)",
            color: "#0a1a36",
          }}
        >
          ⬇ حفظ
        </a>
        <button
          type="button"
          onClick={onClose}
          className="font-kufi text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-lg"
          style={{ background: "var(--burgundy)", color: "#fff" }}
        >
          ✕ إغلاق
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden bg-[#2a2a2a]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3.5 z-10" style={{ background: "var(--reader-bg)" }}>
            <div className="spinner" />
            <div className="font-kufi" style={{ color: "#f5e7be" }}>
              جاري تحميل الكتاب...
            </div>
          </div>
        )}
        <iframe
          src={url}
          title={book.title}
          className="absolute inset-0 w-full h-full border-0"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
