import { useEffect, useRef, useState } from "react";
import {
  type BookCategory,
  type CategoryItem,
  formatBytes,
} from "../types";
import { addBook, fileToDataUrl, listCategories } from "../storage";

interface Props {
  onClose: () => void;
  onAdded: () => void;
  toast: (msg: string, kind?: "ok" | "err" | "info") => void;
}

export function UploadModal({ onClose, onAdded, toast }: Props) {
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [category, setCategory] = useState<BookCategory>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && cats[0]) setCategory(cats[0].id);
    });
  }, []);

  async function handleImage(file: File) {
    setImageFile(file);
    const url = await fileToDataUrl(file);
    setImagePreview(url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast("اكتب اسم الكتاب", "err");
    if (!category) return toast("اختر قسم", "err");
    if (!pdfFile) return toast("اختر ملف PDF", "err");
    if (!imageFile) return toast("اختر صورة الغلاف", "err");

    try {
      setSaving(true);
      await addBook({
        title: title.trim(),
        category,
        pdfFile,
        coverFile: imageFile,
      });
      toast("تمت إضافة الكتاب بنجاح", "ok");
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ";
      toast(msg, "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form className="modal-card" onSubmit={submit}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="إغلاق"
        >
          ✕
        </button>
        <h3 className="modal-title">
          <span style={{ color: "var(--gold-2)" }}>✚</span>
          إضافة كتاب جديد
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">اسم الكتاب</label>
          <input
            className="text-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: لحن إبؤرو"
            disabled={saving}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">القسم</label>
          <select
            className="select-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={saving}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.custom ? " ✦" : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">ملف الكتاب (PDF)</label>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPdfFile(f);
            }}
          />
          <button
            type="button"
            className={`file-drop ${pdfFile ? "has-file" : ""}`}
            onClick={() => pdfRef.current?.click()}
            disabled={saving}
          >
            <span style={{ fontSize: 22 }}>{pdfFile ? "📕" : "📄"}</span>
            {pdfFile ? (
              <>
                <strong style={{ wordBreak: "break-all" }}>
                  {pdfFile.name}
                </strong>
                <small style={{ opacity: 0.8 }}>
                  {formatBytes(pdfFile.size)} — اضغط للتغيير
                </small>
              </>
            ) : (
              <>
                <strong>اختر ملف PDF من جهازك</strong>
                <small style={{ opacity: 0.7 }}>
                  سيُحفظ على السيرفر ويظهر لكل الأجهزة
                </small>
              </>
            )}
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="field-label">صورة الغلاف</label>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImage(f);
            }}
          />
          {imagePreview && (
            <div className="cover-preview" style={{ marginBottom: 10 }}>
              <img src={imagePreview} alt="معاينة الغلاف" />
            </div>
          )}
          <button
            type="button"
            className={`file-drop ${imageFile ? "has-file" : ""}`}
            onClick={() => imgRef.current?.click()}
            disabled={saving}
          >
            <span style={{ fontSize: 22 }}>{imageFile ? "🖼️" : "📷"}</span>
            {imageFile ? (
              <strong>{imageFile.name}</strong>
            ) : (
              <strong>اختر صورة الغلاف من جهازك</strong>
            )}
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            className="btn btn-gold"
            disabled={saving}
            style={{ flex: 1, padding: "14px 20px", fontSize: 14 }}
          >
            {saving ? "جاري الرفع..." : "حفظ الكتاب"}
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 0.5, padding: "14px 20px", fontSize: 14 }}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
