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
          <span className="dashboard-eyebrow">GENEL BAKIŞ</span>
          <h1>Kontrol paneli</h1>
          <p>ServerSatış kataloğunun güncel durumunu takip edin.</p>
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
          <div className="dashboard-card blue">
            <i>▤</i>
            <span>Toplam Ürün</span>
            <strong>
              {stats.totalProducts.toLocaleString("tr-TR")}
            </strong>
          </div>

          <div className="dashboard-card violet">
            <i>◫</i>
            <span>Toplam Kategori</span>
            <strong>
              {stats.totalCategories.toLocaleString("tr-TR")}
            </strong>
          </div>

          <div className="dashboard-card green">
            <i>✓</i>
            <span>Stokta Olan</span>
            <strong>
              {stats.inStock.toLocaleString("tr-TR")}
            </strong>
          </div>

          <div className="dashboard-card amber">
            <i>!</i>
            <span>Stokta Olmayan</span>
            <strong>
              {stats.outOfStock.toLocaleString("tr-TR")}
            </strong>
          </div>
        </div>
      )}

      <section className="admin-welcome-panel">
        <div><span>HIZLI BAŞLANGIÇ</span><h2>Kataloğunuzu güncel tutun.</h2><p>Yeni ürün ekleyin, görselleri yönetin ve kategori yapısını düzenleyin.</p></div>
        <div className="admin-quick-actions"><a href="/admin/products">Ürünleri yönet <span>→</span></a><a href="/admin/categories">Kategorileri düzenle <span>→</span></a></div>
      </section>
    </div>
  );
}

export default AdminDashboard;
