import { useEffect, useMemo, useState } from "react";
import type { Book } from "../types";

interface Props {
  book: Book;
  blob: Blob;
  onClose: () => void;
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function PdfReader({ book, blob, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  const pdfBlob = useMemo(
    () =>
      blob.type === "application/pdf"
        ? blob
        : new Blob([blob], { type: "application/pdf" }),
    [blob],
  );

  useEffect(() => {
    const u = URL.createObjectURL(pdfBlob);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [pdfBlob]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function openInNewTab() {
    if (!url) return;
    window.open(url, "_blank", "noopener");
  }

  const viewerSrc = url
    ? `${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`
    : "";
  const android = isAndroid();

  return (
    <div className="reader-overlay" role="dialog" aria-label="قارئ الكتاب">
      <div className="reader-header">
        <button
          type="button"
          className="reader-btn"
          onClick={onClose}
          aria-label="إغلاق"
        >
          ✕ إغلاق
        </button>
        <button
          type="button"
          className="reader-btn primary"
          onClick={openInNewTab}
          disabled={!url}
        >
          ⤢ فتح في تبويب جديد
        </button>
        <h3 title={book.title}>{book.title}</h3>
      </div>

      <div className="reader-body" dir="ltr">
        {!url ? (
          <div className="reader-empty">
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            جاري تحضير الكتاب...
          </div>
        ) : android ? (
          <div
            className="reader-empty"
            style={{
              maxWidth: 460,
              margin: "auto",
              padding: 28,
              textAlign: "center",
              direction: "rtl",
            }}
          >
            <div style={{ fontSize: 60, color: "var(--gold-2)", marginBottom: 14 }}>
              📕
            </div>
            <h4
              className="font-kufi"
              style={{ margin: "0 0 10px", color: "var(--ink)", fontSize: 18 }}
            >
              فتح الكتاب
            </h4>
            <p
              style={{
                margin: "0 0 18px",
                fontSize: 14,
                color: "var(--ink-soft)",
                lineHeight: 1.7,
              }}
            >
              متصفح أندرويد لا يعرض ملفات PDF داخل الإطار مباشرةً. اضغط على
              «فتح الكتاب» لعرضه في تبويب جديد.
            </p>
            <button
              type="button"
              className="btn btn-gold"
              style={{
                padding: "12px 22px",
                fontSize: 14,
                flex: "0 0 auto",
              }}
              onClick={openInNewTab}
            >
              📖 فتح الكتاب
            </button>
          </div>
        ) : (
          <object
            data={viewerSrc}
            type="application/pdf"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "#fff",
            }}
          >
            <iframe
              src={viewerSrc}
              title={book.title}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "#fff",
              }}
            />
          </object>
        )}
      </div>
    </div>
  );
}
