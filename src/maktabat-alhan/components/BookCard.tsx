import { useState } from "react";
import type { Book } from "../types";

interface Props {
  book: Book;
  isFavorite: boolean;
  isDownloaded: boolean;
  isAdmin: boolean;
  downloading: { loaded: number; total: number } | null;
  onToggleFav: (id: string) => void;
  onOpen: (book: Book) => void;
  onDownload: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export function BookCard({
  book,
  isFavorite,
  isDownloaded,
  isAdmin,
  downloading,
  onToggleFav,
  onOpen,
  onDownload,
  onDelete,
}: Props) {
  const [imgErr, setImgErr] = useState(false);
  const progress = downloading
    ? Math.max(0.02, downloading.loaded / Math.max(1, downloading.total))
    : 0;
  return (
    <div className="book mka-fade-up">
      <div className="book-cover" onClick={() => onOpen(book)}>
        {book.image && !imgErr ? (
          <img
            src={book.image}
            alt={book.title}
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="cover-fallback">{book.title}</div>
        )}
        <span className="book-cover-overlay" />
        <span className="cat-pill">{book.category}</span>
        <button
          type="button"
          className={`fav-btn ${isFavorite ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(book.id);
          }}
          aria-label="مفضلة"
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <h3 className="book-title">{book.title}</h3>

      {downloading && (
        <div className="progress-track">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}

      <div className="book-actions">
        <button
          type="button"
          className="btn btn-gold"
          onClick={() => onOpen(book)}
        >
          {isDownloaded ? "📖 قراءة" : "👁 معاينة"}
        </button>
        {!isDownloaded && (
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => onDownload(book)}
            disabled={!!downloading}
          >
            {downloading ? "..." : "⬇ تحميل"}
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onDelete(book)}
            aria-label="حذف الكتاب"
            title="حذف"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
