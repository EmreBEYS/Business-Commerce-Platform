import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../lib/catalogApi";

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", repeatPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.repeatPassword) {
      setMessage({ type: "error", text: "Yeni şifreler birbiriyle eşleşmiyor." });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await fetch(API_URL + "/api/admin/auth/password", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Şifre değiştirilemedi.");
      setMessage({ type: "success", text: data.message });
      window.setTimeout(() => navigate("/admin/login", { replace: true }), 1200);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return <div className="admin-settings-page">
    <div className="admin-page-header"><div><span className="admin-page-label">HESAP GÜVENLİĞİ</span><h1>Şifre Değiştir</h1><p>Şifrenizi değiştirdiğinizde açık yönetici oturumları güvenlik için kapatılır.</p></div></div>
    <form className="admin-settings-card" onSubmit={submit}>
      {message.text && <div className={message.type === "error" ? "admin-error" : "admin-success"} role="alert">{message.text}</div>}
      <label>Mevcut Şifre<input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></label>
      <label>Yeni Şifre<input type="password" autoComplete="new-password" minLength="10" maxLength="128" required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /><small>En az 10 karakter kullanın.</small></label>
      <label>Yeni Şifre Tekrar<input type="password" autoComplete="new-password" minLength="10" maxLength="128" required value={form.repeatPassword} onChange={(event) => setForm({ ...form, repeatPassword: event.target.value })} /></label>
      <button className="primary-action-button" disabled={saving}>{saving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}</button>
    </form>
  </div>;
}
