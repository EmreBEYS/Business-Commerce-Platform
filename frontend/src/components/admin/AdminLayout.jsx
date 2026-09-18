import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../../lib/catalogApi";
import "../../styles/admin.css";


function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/auth/me`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await fetch(`${API_URL}/api/admin/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/serversatis-logo.png" alt="ServerSatış" />
          <span>YÖNETİM MERKEZİ</span>
        </div>

        <nav aria-label="Admin menüsü">
          <span className="admin-nav-label">MENÜ</span>
          <NavLink end className="admin-nav-item" to="/admin"><i>⌂</i><span>Genel Bakış</span></NavLink>
          <NavLink className="admin-nav-item" to="/admin/products"><i>▤</i><span>Ürünler</span></NavLink>
          <NavLink className="admin-nav-item" to="/admin/categories"><i>◫</i><span>Kategoriler</span></NavLink>
          {user?.role === "super_admin" && (
            <>
              <NavLink className="admin-nav-item" to="/admin/users"><i>♙</i><span>Yöneticiler</span></NavLink>
              <NavLink className="admin-nav-item" to="/admin/audit"><i>⌁</i><span>İşlem Geçmişi</span></NavLink>
            </>
          )}
          <NavLink className="admin-nav-item" to="/admin/settings"><i>⚿</i><span>Şifre Değiştir</span></NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-current-user">
            <i>{(user?.displayName || user?.username || "Y").slice(0, 1).toLocaleUpperCase("tr-TR")}</i>
            <span><b>{user?.displayName || "Yönetici"}</b><small>@{user?.username || "admin"}</small></span>
          </div>
          <button className="admin-logout-button" onClick={logout}><span>↪</span> Güvenli Çıkış</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div><i /> Sistem çevrimiçi</div>
          <a href="/" target="_blank" rel="noreferrer">Siteyi görüntüle <span>↗</span></a>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  );
}

export default AdminLayout;
