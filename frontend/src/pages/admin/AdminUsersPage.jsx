import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../lib/catalogApi";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Henüz giriş yapmadı";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [maxActiveAdmins, setMaxActiveAdmins] = useState(3);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", username: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/users`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Yöneticiler alınamadı.");
      setUsers(data.users);
      setActiveCount(data.activeCount);
      setMaxActiveAdmins(data.maxActiveAdmins);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRequest = window.setTimeout(loadUsers, 0);
    return () => window.clearTimeout(initialRequest);
  }, [loadUsers]);

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Yönetici oluşturulamadı.");
      setEditing(false);
      setForm({ displayName: "", username: "", password: "" });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    const action = user.is_active ? "devre dışı bırakmak" : "etkinleştirmek";
    if (!window.confirm(`${user.display_name} hesabını ${action} istediğinize emin misiniz?`)) return;
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.is_active }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Hesap güncellenemedi.");
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-page-label">ERİŞİM YÖNETİMİ</span>
          <h1>Yöneticiler</h1>
          <p>Her yönetici kendi hesabıyla giriş yapar. Aktif hesap: {activeCount}/{maxActiveAdmins}</p>
        </div>
        <button
          className="primary-action-button"
          type="button"
          disabled={activeCount >= maxActiveAdmins}
          onClick={() => setEditing(true)}
        >
          <span>+</span> Yeni Yönetici
        </button>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}

      <div className="admin-capacity-card">
        <div><span>Yönetici kapasitesi</span><strong>{activeCount} / {maxActiveAdmins}</strong></div>
        <div className="capacity-track"><i style={{ width: `${(activeCount / maxActiveAdmins) * 100}%` }} /></div>
        <p>Güvenlik için ortak hesap yerine üç ayrı kullanıcı hesabı kullanılır.</p>
      </div>

      {loading ? <div className="admin-loading">Yöneticiler yükleniyor...</div> : (
        <div className="admin-user-grid">
          {users.map((user) => (
            <article className="admin-user-card" key={user.id}>
              <div className="admin-user-avatar">{user.display_name.slice(0, 1).toLocaleUpperCase("tr-TR")}</div>
              <div className="admin-user-copy">
                <div className="admin-user-title">
                  <h2>{user.display_name}</h2>
                  <span className={user.is_active ? "user-status active" : "user-status"}>
                    {user.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <b>@{user.username}</b>
                <p>Son giriş: {formatDate(user.last_login_at)}</p>
                <small>{user.role === "super_admin" ? "Ana yönetici" : "Yönetici"}</small>
              </div>
              {user.role !== "super_admin" && (
                <button className="user-status-button" type="button" onClick={() => toggleStatus(user)}>
                  {user.is_active ? "Devre dışı bırak" : "Etkinleştir"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !saving && setEditing(false)}>
          <form className="admin-modal category-modal" onSubmit={createUser} onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div><span>YENİ HESAP</span><h2>Yönetici oluştur</h2></div>
              <button type="button" aria-label="Kapat" onClick={() => setEditing(false)}>×</button>
            </div>
            <label>
              Ad Soyad
              <input required minLength="2" maxLength="100" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
            </label>
            <label>
              Kullanıcı Adı
              <input required minLength="3" maxLength="50" autoComplete="off" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              <small>Harf, rakam, nokta, tire ve alt çizgi kullanılabilir.</small>
            </label>
            <label>
              İlk Şifre
              <input required minLength="10" maxLength="128" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <small>En az 10 karakter kullanın ve şifreyi yöneticiye güvenli biçimde iletin.</small>
            </label>
            <div className="admin-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEditing(false)} disabled={saving}>Vazgeç</button>
              <button type="submit" disabled={saving}>{saving ? "Oluşturuluyor..." : "Hesabı Oluştur"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
