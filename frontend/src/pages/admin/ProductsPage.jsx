import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../lib/catalogApi";

const stockLabel = (availability) => ({
  IN_STOCK: "Stokta",
  LOW_STOCK: "Az Stok",
  OUT_OF_STOCK: "Stok Yok",
}[availability] || availability);

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async (page = 1, searchValue = "") => {
    try {
      await Promise.resolve();
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (searchValue) {
        params.set("search", searchValue);
      }

      const response = await fetch(
        `${API_URL}/api/admin/products?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Ürünler alınamadı.");
      }

      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialProductsRequest = window.setTimeout(() => {
      fetchProducts(1, "");
    }, 0);

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/categories`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Kategoriler alınamadı.");
        }

        setCategories(data.categories);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadCategories();

    return () => window.clearTimeout(initialProductsRequest);
  }, [fetchProducts]);

  const openEditor = (product) => {
    setError("");
    setEditing({
      id: product.id,
      name: product.name,
      brand: product.brand || "",
      description: product.description || "",
      imageUrl: product.image_url || "",
      stockQuantity: product.stock_quantity ?? 0,
      categoryId: product.category_id || "",
    });
  };

  const openCreator = () => {
    setError("");
    setEditing({
      id: null,
      name: "",
      brand: "",
      description: "",
      imageUrl: "",
      stockQuantity: 0,
      categoryId: "",
    });
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { id, ...fields } = editing;
      const isCreating = !id;
      const response = await fetch(
        isCreating
          ? `${API_URL}/api/admin/products`
          : `${API_URL}/api/admin/products/${id}`,
        {
        method: isCreating ? "POST" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          stockQuantity: Number(fields.stockQuantity),
        }),
        }
      );
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        window.location.assign("/admin/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Ürün ${isCreating ? "eklenemedi" : "güncellenemedi"}.`);
      }

      if (isCreating) {
        await fetchProducts(1, search);
      } else {
        setProducts((current) => current.map((product) =>
          product.id === data.product.id
            ? { ...product, ...data.product }
            : product
        ));
      }
      setEditing(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const value = searchInput.trim();

    setSearch(value);
    fetchProducts(1, value);
  };

  const handlePrevious = () => {
    if (pagination.page > 1) {
      fetchProducts(pagination.page - 1, search);
    }
  };

  const handleNext = () => {
    if (pagination.page < pagination.totalPages) {
      fetchProducts(pagination.page + 1, search);
    }
  };

  return (
    <div className="admin-products-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-page-label">YÖNETİM PANELİ</span>
          <h1>Ürünler</h1>
          <p>
            Toplam {pagination.total.toLocaleString("tr-TR")} ürün
            görüntüleniyor.
          </p>
        </div>
        <button className="primary-action-button" type="button" onClick={openCreator}>
          + Yeni Ürün Ekle
        </button>
      </div>

      <form className="product-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Ürün adı, marka veya slug ara..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <button type="submit">Ara</button>
      </form>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Ürünler yükleniyor...</div>
      ) : (
        <>
          <div className="products-table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Marka</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-table-name">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            —
                          </div>
                        )}

                        <span>{product.name}</span>
                      </div>
                    </td>

                    <td>{product.brand || "—"}</td>

                    <td>{product.category_name || "—"}</td>

                    <td>{product.stock_quantity}</td>

                    <td>
                      <span
                        className={
                          `stock-badge ${product.availability
                            .toLowerCase()
                            .replaceAll("_", "-")}`
                        }
                      >
                        {stockLabel(product.availability)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="edit-product-button"
                        type="button"
                        onClick={() => openEditor(product)}
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-products">
                      Ürün bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="products-pagination">
            <button
              onClick={handlePrevious}
              disabled={pagination.page <= 1}
            >
              ← Önceki
            </button>

            <span>
              Sayfa <strong>{pagination.page}</strong> /{" "}
              {pagination.totalPages}
            </span>

            <button
              onClick={handleNext}
              disabled={pagination.page >= pagination.totalPages}
            >
              Sonraki →
            </button>
          </div>
        </>
      )}

      {editing && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={() => !saving && setEditing(null)}
        >
          <form
            className="admin-modal"
            onSubmit={saveProduct}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>{editing.id ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
              <button type="button" aria-label="Kapat" onClick={() => setEditing(null)}>×</button>
            </div>

            <label>
              Ürün Adı
              <input required minLength="2" maxLength="400" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
            </label>

            <div className="admin-form-row">
              <label>
                Marka
                <input required maxLength="200" value={editing.brand} onChange={(event) => setEditing({ ...editing, brand: event.target.value })} />
              </label>
              <label>
                Kategori
                <select required value={editing.categoryId} onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })}>
                  <option value="">Kategori seçin</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.path}</option>)}
                </select>
              </label>
            </div>

            <label>
              Açıklama
              <textarea rows="5" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            </label>

            <label>
              Görsel URL veya Yerel Yol
              <input type="text" maxLength="2048" placeholder="/product-images/urun.webp" value={editing.imageUrl} onChange={(event) => setEditing({ ...editing, imageUrl: event.target.value })} />
              <small>Yerel görselleri public/product-images klasörüne ekleyip /product-images/dosya.webp biçiminde kullanın.</small>
            </label>

            <label>
              Stok Miktarı
              <input type="number" required min="0" max="1000000" step="1" value={editing.stockQuantity} onChange={(event) => setEditing({ ...editing, stockQuantity: event.target.value })} />
              <small>Stok durumu miktara göre otomatik belirlenir.</small>
            </label>

            <div className="admin-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEditing(null)} disabled={saving}>Vazgeç</button>
              <button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : editing.id ? "Değişiklikleri Kaydet" : "Ürünü Ekle"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
