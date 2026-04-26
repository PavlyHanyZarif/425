import express from "express";
import cors from "cors";
import multer from "multer";
import { promises as fs } from "node:fs";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR || path.join(ROOT, "dist"));

const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const PDFS_DIR = path.join(UPLOADS_DIR, "pdfs");
const COVERS_DIR = path.join(UPLOADS_DIR, "covers");
const BOOKS_FILE = path.join(DATA_DIR, "books.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

for (const d of [DATA_DIR, UPLOADS_DIR, PDFS_DIR, COVERS_DIR]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

function bookToWire(b) {
  return {
    id: b.id,
    title: b.title,
    category: b.category,
    addedAt: b.addedAt,
    pdfSize: b.pdfSize,
    coverUrl: `/api/files/covers/${b.coverFile}`,
    pdfUrl: `/api/files/pdfs/${b.pdfFile}`,
  };
}

const storage = multer.diskStorage({
  destination(_req, file, cb) {
    cb(null, file.fieldname === "pdf" ? PDFS_DIR : COVERS_DIR);
  },
  filename(_req, file, cb) {
    cb(null, `${randomUUID()}${path.extname(file.originalname) || ""}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const api = express.Router();

api.get("/healthz", (_req, res) => res.json({ status: "ok" }));

api.get("/books", async (_req, res) => {
  const books = await readJson(BOOKS_FILE, []);
  res.json(books.map(bookToWire));
});

api.post(
  "/books",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const pdf = req.files?.pdf?.[0];
      const cover = req.files?.cover?.[0];
      const title = String(req.body?.title || "").trim();
      const category = String(req.body?.category || "").trim();

      if (!title) return res.status(400).json({ error: "اسم الكتاب مطلوب" });
      if (!category) return res.status(400).json({ error: "القسم مطلوب" });
      if (!pdf) return res.status(400).json({ error: "ملف PDF مطلوب" });
      if (!cover) return res.status(400).json({ error: "صورة الغلاف مطلوبة" });

      const book = {
        id: randomUUID(),
        title,
        category,
        addedAt: Date.now(),
        pdfSize: pdf.size,
        pdfFile: path.basename(pdf.path),
        coverFile: path.basename(cover.path),
      };
      const books = await readJson(BOOKS_FILE, []);
      books.push(book);
      await writeJson(BOOKS_FILE, books);
      res.status(201).json(bookToWire(book));
    } catch (err) {
      console.error("addBook failed:", err);
      res.status(500).json({ error: "تعذر حفظ الكتاب" });
    }
  },
);

api.delete("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const books = await readJson(BOOKS_FILE, []);
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return res.status(404).json({ error: "غير موجود" });
    const [removed] = books.splice(idx, 1);
    if (removed) {
      await fs.unlink(path.join(PDFS_DIR, removed.pdfFile)).catch(() => {});
      await fs.unlink(path.join(COVERS_DIR, removed.coverFile)).catch(() => {});
    }
    await writeJson(BOOKS_FILE, books);
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteBook failed:", err);
    res.status(500).json({ error: "تعذر الحذف" });
  }
});

api.get("/categories", async (_req, res) => {
  const cats = await readJson(CATEGORIES_FILE, []);
  res.json(cats);
});

const RESERVED_DEFAULT_CATEGORIES = new Set([
  "كتب هزات",
  "تمجيدات",
  "طقس والحان",
  "طقس وألحان",
  "قرائات",
  "قراءات",
]);

api.post("/categories", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "اسم القسم مطلوب" });
    if (RESERVED_DEFAULT_CATEGORIES.has(name)) {
      return res.status(409).json({ error: "هذا القسم موجود بالفعل" });
    }
    const cats = await readJson(CATEGORIES_FILE, []);
    if (cats.some((c) => c.name === name || c.id === name)) {
      return res.status(409).json({ error: "هذا القسم موجود بالفعل" });
    }
    const item = { id: randomUUID(), name };
    cats.push(item);
    await writeJson(CATEGORIES_FILE, cats);
    res.status(201).json({ ...item, custom: true });
  } catch (err) {
    console.error("addCategory failed:", err);
    res.status(500).json({ error: "تعذر إضافة القسم — راجع سجل السيرفر" });
  }
});

api.delete("/categories/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const cats = await readJson(CATEGORIES_FILE, []);
    const next = cats.filter((c) => c.id !== id);
    if (next.length === cats.length)
      return res.status(404).json({ error: "غير موجود" });
    await writeJson(CATEGORIES_FILE, next);
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteCategory failed:", err);
    res.status(500).json({ error: "تعذر الحذف" });
  }
});

api.use("/files", express.static(UPLOADS_DIR, { fallthrough: false }));

app.use("/api", api);

if (existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });
} else {
  console.log(
    `\n[i] لا يوجد مجلد dist/ بعد. شغّل "npm run build" لتجهيز الواجهة لوضع الإنتاج.\n` +
      `   حاليًا الـ API فقط شغّال على /api (مع vite في الواجهة على البورت 5173).\n`,
  );
}

app.listen(PORT, () => {
  console.log(`\n✓ السيرفر شغّال على http://localhost:${PORT}`);
  console.log(`  📂 البيانات تتخزن في: ${DATA_DIR}`);
  if (existsSync(PUBLIC_DIR)) {
    console.log(`  🌐 الواجهة: http://localhost:${PORT}`);
  } else {
    console.log(`  🌐 الواجهة في وضع التطوير: http://localhost:5173`);
  }
  console.log("");
});
