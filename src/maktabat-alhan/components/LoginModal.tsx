import { useState } from "react";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../types";

interface Props {
  onClose: () => void;
  onLogin: () => void;
  toast: (msg: string, kind?: "ok" | "err" | "info") => void;
}

export function LoginModal({ onClose, onLogin, toast }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("mka:isAdmin", "1");
      toast("مرحبًا بك أيها الأدمن", "ok");
      onLogin();
      onClose();
    } else {
      toast("بيانات الدخول غير صحيحة", "err");
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="modal-card" style={{ maxWidth: 420 }} onSubmit={submit}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          ✕
        </button>
        <h3 className="modal-title">
          <span style={{ color: "var(--gold-2)" }}>✚</span>
          دخول الأدمن
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">البريد الإلكتروني</label>
          <input
            className="text-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@app.com"
            autoFocus
            dir="ltr"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="field-label">كلمة المرور</label>
          <input
            className="text-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            dir="ltr"
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            className="btn btn-gold"
            style={{ flex: 1, padding: "14px 20px", fontSize: 14 }}
          >
            دخول
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={onClose}
            style={{ flex: 0.5, padding: "14px 20px", fontSize: 14 }}
          >
            إلغاء
          </button>
        </div>

        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
            fontSize: 12,
            color: "var(--ink-mute)",
            textAlign: "center",
            fontFamily: "Reem Kufi, serif",
          }}
        >
          البيانات الافتراضية: admin@app.com / 123456
        </p>
      </form>
    </div>
  );
}
