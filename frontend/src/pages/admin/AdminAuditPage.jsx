import { useEffect, useState } from "react";
import { API_URL } from "../../lib/catalogApi";

const labels = {
  POST_PRODUCTS: "Ürün eklendi",
  PATCH_PRODUCTS: "Ürün güncellendi",
  DELETE_PRODUCTS: "Ürün veya görsel silindi",
  POST_CATEGORIES: "Kategori eklendi",
  PATCH_CATEGORIES: "Kategori güncellendi",
  DELETE_CATEGORIES: "Kategori silindi",
  POST_USERS: "Yönetici eklendi",
  PATCH_USERS: "Yönetici durumu değişti",
  PATCH_AUTH: "Şifre değiştirildi",
  POST_AUTH: "Oturum işlemi",
};

export default function AdminAuditPage() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/api/admin/audit?limit=100", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "İşlem geçmişi alınamadı.");
        setEvents(data.events);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return <div>
    <div className="admin-page-header"><div><span className="admin-page-label">GÜVENLİK KAYITLARI</span><h1>İşlem Geçmişi</h1><p>Yöneticilerin son 100 değişikliği.</p></div></div>
    {error && <div className="admin-error" role="alert">{error}</div>}
    {loading ? <div className="admin-loading">Kayıtlar yükleniyor...</div> : <div className="products-table-wrapper"><table className="products-table audit-table"><thead><tr><th>Tarih</th><th>Yönetici</th><th>İşlem</th><th>Hedef</th></tr></thead><tbody>
      {events.map((item) => <tr key={item.id}><td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</td><td><strong>@{item.actor_username}</strong></td><td>{labels[item.action] || item.action}</td><td>{item.entity_id || item.entity_type}</td></tr>)}
      {!events.length && <tr><td colSpan="4" className="empty-products">Henüz kayıtlı yönetici işlemi yok.</td></tr>}
    </tbody></table></div>}
  </div>;
}
