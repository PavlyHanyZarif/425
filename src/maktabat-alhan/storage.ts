import type {
  Book,
  BookCategory,
  CategoryItem,
  DownloadInfo,
} from "./types";
import { DEFAULT_CATEGORIES } from "./types";

const API = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

const DB_NAME = "maktabat-alhan-db";
const DB_VERSION = 2;
const STORE_BOOKS_CACHE = "books-cache";
const STORE_PDFS = "pdfs";
const STORE_META = "meta";

const FAV_KEY = "favorites";
const BOOKS_CACHE_KEY = "all-books";
const CATS_CACHE_KEY = "all-categories";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains("books")) db.deleteObjectStore("books");
      if (!db.objectStoreNames.contains(STORE_BOOKS_CACHE))
        db.createObjectStore(STORE_BOOKS_CACHE);
      if (!db.objectStoreNames.contains(STORE_PDFS))
        db.createObjectStore(STORE_PDFS);
      if (!db.objectStoreNames.contains(STORE_META))
        db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const r = fn(t.objectStore(store));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      }),
  );
}

async function metaGet<T>(key: string): Promise<T | undefined> {
  return tx<T>(STORE_META, "readonly", (s) => s.get(key) as IDBRequest<T>);
}
async function metaSet(key: string, value: unknown): Promise<void> {
  await tx(STORE_META, "readwrite", (s) => s.put(value, key));
}

interface ServerBook {
  id: string;
  title: string;
  category: string;
  addedAt: number;
  pdfSize: number;
  coverUrl: string;
  pdfUrl: string;
}

function fromServer(b: ServerBook): Book {
  return {
    id: b.id,
    title: b.title,
    category: b.category,
    image: b.coverUrl,
    addedAt: b.addedAt,
    pdfUrl: b.pdfUrl,
    pdfSize: b.pdfSize,
  };
}

export async function ensureSeeded(): Promise<void> {
  return;
}

export async function listBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API}/books`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ServerBook[];
    const books = data.map(fromServer);
    await metaSet(BOOKS_CACHE_KEY, books);
    return books.sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    const cached = (await metaGet<Book[]>(BOOKS_CACHE_KEY)) ?? [];
    return cached.sort((a, b) => b.addedAt - a.addedAt);
  }
}

export async function addBook(b: {
  title: string;
  category: BookCategory;
  pdfFile: File;
  coverFile: File;
}): Promise<Book> {
  const form = new FormData();
  form.append("title", b.title);
  form.append("category", b.category);
  form.append("pdf", b.pdfFile);
  form.append("cover", b.coverFile);
  let res: Response;
  try {
    res = await fetch(`${API}/books`, { method: "POST", body: form });
  } catch {
    throw new Error("لا يمكن الوصول للسيرفر — تأكد من الاتصال بالإنترنت");
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "فشل رفع الكتاب"));
  }
  const sb = (await res.json()) as ServerBook;
  return fromServer(sb);
}

export async function deleteBook(id: string): Promise<void> {
  const res = await fetch(`${API}/books/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("فشل الحذف");
  await tx(STORE_PDFS, "readwrite", (s) => s.delete(id));
}

export async function downloadPdfFromUrl(
  book: Book,
  onProgress: (loaded: number, total: number) => void,
): Promise<DownloadInfo> {
  if (!book.pdfUrl) throw new Error("لا يوجد رابط للكتاب");
  const res = await fetch(book.pdfUrl);
  if (!res.ok || !res.body) throw new Error(`فشل التحميل: ${res.status}`);
  const total = Number(res.headers.get("content-length") || 0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress(loaded, total || loaded);
    }
  }
  const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
  const info: DownloadInfo = {
    bookId: book.id,
    size: blob.size,
    downloadedAt: Date.now(),
  };
  await tx(STORE_PDFS, "readwrite", (s) => s.put({ blob, info }, book.id));
  return info;
}

export async function getPdfBlob(bookId: string): Promise<Blob | null> {
  const rec = await tx<{ blob: Blob; info: DownloadInfo } | undefined>(
    STORE_PDFS,
    "readonly",
    (s) => s.get(bookId) as IDBRequest<{ blob: Blob; info: DownloadInfo }>,
  );
  return rec?.blob ?? null;
}

export async function listDownloadedIds(): Promise<string[]> {
  return tx<string[]>(
    STORE_PDFS,
    "readonly",
    (s) => s.getAllKeys() as IDBRequest<string[]>,
  );
}

export async function deleteDownload(bookId: string): Promise<void> {
  await tx(STORE_PDFS, "readwrite", (s) => s.delete(bookId));
}

export async function getFavorites(): Promise<string[]> {
  return (await metaGet<string[]>(FAV_KEY)) ?? [];
}

export async function toggleFavorite(bookId: string): Promise<string[]> {
  const cur = await getFavorites();
  const next = cur.includes(bookId)
    ? cur.filter((x) => x !== bookId)
    : [...cur, bookId];
  await metaSet(FAV_KEY, next);
  return next;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function listCustomCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API}/categories`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as CategoryItem[];
    const items = data.map((c) => ({ ...c, custom: true }));
    await metaSet(CATS_CACHE_KEY, items);
    return items;
  } catch {
    return (await metaGet<CategoryItem[]>(CATS_CACHE_KEY)) ?? [];
  }
}

export async function listCategories(): Promise<CategoryItem[]> {
  const custom = await listCustomCategories();
  return [...DEFAULT_CATEGORIES, ...custom];
}

async function readErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return `${fallback} (HTTP ${res.status})`;
  try {
    const parsed = JSON.parse(text) as { error?: string };
    if (parsed?.error && typeof parsed.error === "string") return parsed.error;
  } catch {
    // not JSON; ignore
  }
  return `${fallback} (HTTP ${res.status})`;
}

export async function addCategory(name: string): Promise<CategoryItem> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("اكتب اسم القسم أولًا");
  const isDefault = DEFAULT_CATEGORIES.some(
    (c) => c.id === trimmed || c.name === trimmed,
  );
  if (isDefault) throw new Error("هذا القسم موجود بالفعل");

  let res: Response;
  try {
    res = await fetch(`${API}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  } catch {
    throw new Error("لا يمكن الوصول للسيرفر — تأكد من الاتصال بالإنترنت");
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "تعذر إضافة القسم"));
  }
  return (await res.json()) as CategoryItem;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API}/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "تعذر حذف القسم"));
  }
}
