import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8000";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/categories`, { credentials: "include" });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        window.location.assign("/admin/login");
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.message || "Kategoriler alınamadı.");
      setCategories(data.categories);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRequest = window.setTimeout(loadCategories, 0);
    return () => window.clearTimeout(initialRequest);
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    if (!needle) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.path} ${category.parent_name || ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(needle)
    );
  }, [categories, search]);

  const selectableParents = useMemo(() => {
    if (!editing?.id) return categories;
    const current = categories.find((category) => category.id === editing.id);
    if (!current) return categories.filter((category) => category.id !== editing.id);
    return categories.filter(
      (category) => category.id !== editing.id && !category.path.startsWith(`${current.path} > `)
    );
  }, [categories, editing]);

  const openCreator = () => {
    setError("");
    setEditing({ id: null, name: "", parentId: "" });
  };

  const openEditor = (category) => {
    setError("");
    setEditing({ id: category.id, name: category.name, parentId: category.parent_id || "" });
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isCreating = !editing.id;
      const response = await fetch(
        isCreating ? `${API_URL}/api/admin/categories` : `${API_URL}/api/admin/categories/${editing.id}`,
        {
          method: isCreating ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editing.name, parentId: editing.parentId || null }),
        }
      );
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        window.location.assign("/admin/login");
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Kategori ${isCreating ? "eklenemedi" : "güncellenemedi"}.`);
      }
      setEditing(null);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <span className="admin-page-label">YÖNETİM PANELİ</span>
          <h1>Kategoriler</h1>
          <p>{categories.length.toLocaleString("tr-TR")} kategori ve ürün dağılımı.</p>
        </div>
        <button className="primary-action-button" type="button" onClick={openCreator}>+ Yeni Kategori Ekle</button>
      </div>
      <div className="product-search">
        <input type="search" aria-label="Kategori ara" placeholder="Kategori veya yol ara..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {error && <div className="admin-error" role="alert">{error}</div>}
      {loading ? <div className="admin-loading">Kategoriler yükleniyor...</div> : (
        <div className="products-table-wrapper">
          <table className="products-table categories-table">
            <thead><tr><th>Kategori</th><th>Üst Kategori</th><th>Yol</th><th>Ürün Sayısı</th><th>İşlemler</th></tr></thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.parent_name || "Ana kategori"}</td>
                  <td>{category.path}</td>
                  <td>{category.product_count.toLocaleString("tr-TR")}</td>
                  <td><button className="edit-product-button" type="button" onClick={() => openEditor(category)}>Düzenle</button></td>
                </tr>
              ))}
              {filteredCategories.length === 0 && <tr><td colSpan="5" className="empty-products">Kategori bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !saving && setEditing(null)}>
          <form className="admin-modal category-modal" onSubmit={saveCategory} onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editing.id ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}</h2>
              <button type="button" aria-label="Kapat" onClick={() => setEditing(null)}>×</button>
            </div>
            <label>
              Kategori Adı
              <input required minLength="2" maxLength="200" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
            </label>
            <label>
              Üst Kategori
              <select value={editing.parentId} onChange={(event) => setEditing({ ...editing, parentId: event.target.value })}>
                <option value="">Ana kategori</option>
                {selectableParents.map((category) => <option key={category.id} value={category.id}>{category.path}</option>)}
              </select>
              <small>Boş bırakırsanız ana kategori olarak kaydedilir.</small>
            </label>
            <div className="admin-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEditing(null)} disabled={saving}>Vazgeç</button>
              <button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : editing.id ? "Değişiklikleri Kaydet" : "Kategoriyi Ekle"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
