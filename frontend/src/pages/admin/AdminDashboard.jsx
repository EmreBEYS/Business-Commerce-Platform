import { useEffect, useState } from "react";
import { API_URL } from "../../lib/catalogApi";
import "../../styles/admin.css";


function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/dashboard/stats`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("İstatistikler alınamadı.");
        }

        const data = await response.json();

        setStats(data.stats);
      } catch (err) {
        setError(err.message);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">YÖNETİM PANELİ</span>
          <h1>Dashboard</h1>
          <p>
            Business Commerce Platform genel durumu
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {!stats && !error && (
        <p>İstatistikler yükleniyor...</p>
      )}

      {stats && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span>Toplam Ürün</span>
            <strong>
              {stats.totalProducts.toLocaleString("tr-TR")}
            </strong>
          </div>

          <div className="dashboard-card">
            <span>Toplam Kategori</span>
            <strong>
              {stats.totalCategories.toLocaleString("tr-TR")}
            </strong>
          </div>

          <div className="dashboard-card">
            <span>Stokta Olan</span>
            <strong>
              {stats.inStock.toLocaleString("tr-TR")}
            </strong>
          </div>

          <div className="dashboard-card">
            <span>Stokta Olmayan</span>
            <strong>
              {stats.outOfStock.toLocaleString("tr-TR")}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
