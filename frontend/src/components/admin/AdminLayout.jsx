import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { API_URL } from "../../lib/catalogApi";
import "../../styles/admin.css";


function AdminLayout() {
  const navigate = useNavigate();

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
        <h2>Business Commerce</h2>

        <nav aria-label="Admin menüsü">
          <NavLink end className="admin-nav-item" to="/admin">Dashboard</NavLink>
          <NavLink className="admin-nav-item" to="/admin/products">Ürünler</NavLink>
          <NavLink className="admin-nav-item" to="/admin/categories">Kategoriler</NavLink>
        </nav>

        <button className="admin-logout-button" onClick={logout}>Çıkış Yap</button>
      </aside>

      <main className="admin-content"><Outlet /></main>
    </div>
  );
}

export default AdminLayout;
