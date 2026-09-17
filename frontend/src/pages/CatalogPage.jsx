import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";
import ProductCard from "../components/storefront/ProductCard";
import { getCategories, getProducts, WHATSAPP_URL } from "../lib/catalogApi";

const EMPTY_DATA = { products: [], pagination: { page: 1, total: 0, totalPages: 0 } };

export default function CatalogPage() {
  const { categorySlug = "" } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(EMPTY_DATA);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");

  const q = params.get("q") || "";
  const deferredQuery = useDeferredValue(q);
  const queryCategoryId = params.get("categoryId") || "";
  const brand = params.get("brand") || "";
  const sort = params.get("sort") || "name-asc";
  const parsedPage = Number.parseInt(params.get("page") || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const routeCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug),
    [categories, categorySlug],
  );
  const categoryId = queryCategoryId || routeCategory?.id || "";
  const selectedCategory = categories.find((category) => category.id === categoryId);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((result) => {
        if (active) setCategories(result.categories || []);
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (categoriesLoading) return undefined;
    if (categorySlug && !routeCategory) {
      Promise.resolve().then(() => {
        setError("Bu kategori bulunamadı veya artık yayında değil.");
        setData(EMPTY_DATA);
        setLoading(false);
      });
      return undefined;
    }

    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setLoading(true);
        setError("");
      }
    });
    getProducts({ q: deferredQuery, categoryId, brand, sort, page, limit: 24 })
      .then((result) => {
        if (!active) return;
        setData(result);
        setBrands(result.brands || []);
      })
      .catch((requestError) => {
        if (!active) return;
        setData(EMPTY_DATA);
        setError(requestError.message || "Katalog şu anda yüklenemiyor.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [deferredQuery, categoryId, brand, sort, page, categorySlug, routeCategory, categoriesLoading]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    if (!Object.hasOwn(changes, "page")) next.delete("page");

    if (Object.hasOwn(changes, "categoryId") && categorySlug) {
      navigate(`/katalog${next.size ? `?${next.toString()}` : ""}`);
      return;
    }
    setParams(next);
  };

  const clearFilters = () => navigate("/katalog");
  const topLevelCategories = categories.filter((category) => !category.parent_id);

  return <main className="storefront"><SiteHeader/><section className="catalog-hero"><div className="store-shell"><span><Link to="/">ANA SAYFA</Link> / KATALOG{selectedCategory ? ` / ${selectedCategory.name.toLocaleUpperCase("tr-TR")}` : ""}</span><h1>{selectedCategory?.name || "Ürün Kataloğu"}</h1><p>{selectedCategory ? `${selectedCategory.product_count.toLocaleString("tr-TR")} ürün arasından ihtiyacınıza uygun çözümü keşfedin.` : "Kurumsal altyapınız için dünya çapında tedarik edebildiğimiz ürünleri keşfedin."}</p></div></section><div className="store-shell catalog-layout"><aside className="catalog-filters"><div className="filter-head"><b>Filtreler</b><button onClick={clearFilters}>Temizle</button></div><label>ÜRÜN ARA<input value={q} onChange={(event) => update({ q: event.target.value })} placeholder="Model, marka, parça no..."/></label><label>KATEGORİ<select value={categoryId} onChange={(event) => update({ categoryId: event.target.value })}><option value="">Tüm kategoriler</option>{topLevelCategories.map((parent) => <optgroup label={`${parent.name} (${parent.product_count})`} key={parent.id}><option value={parent.id}>{parent.name} — tümü</option>{categories.filter((category) => category.parent_id === parent.id).map((category) => <option key={category.id} value={category.id}>↳ {category.name} ({category.product_count})</option>)}</optgroup>)}</select></label><label>MARKA<select value={brand} onChange={(event) => update({ brand: event.target.value })}><option value="">Tüm markalar</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><div className="catalog-category-links"><b>KATEGORİLER</b>{topLevelCategories.map((category) => <Link className={category.id === categoryId ? "active" : ""} to={`/kategori/${category.slug}`} key={category.id}><span>{category.name}</span><em>{category.product_count.toLocaleString("tr-TR")}</em></Link>)}</div><div className="catalog-support"><span>◔</span><b>Doğru ürünü bulamadınız mı?</b><p>Uzmanımız ihtiyacınıza uygun ürünü bulsun.</p><a href={WHATSAPP_URL}>WhatsApp&apos;tan sorun →</a></div></aside><section className="catalog-results"><div className="results-head"><div><b>{data.pagination.total.toLocaleString("tr-TR")} ürün</b><span>{q ? `“${q}” araması için sonuçlar` : selectedCategory?.path || "Global tedarik kataloğu"}</span></div><label>SIRALA<select value={sort} onChange={(event) => update({ sort: event.target.value })}><option value="name-asc">Ürün adı A–Z</option><option value="name-desc">Ürün adı Z–A</option><option value="newest">En yeni</option></select></label></div>{(q || brand || categoryId) && <div className="filter-chips"><span>Aktif filtreler</span>{q && <button onClick={() => update({ q: "" })}>Arama: {q} ×</button>}{brand && <button onClick={() => update({ brand: "" })}>{brand} ×</button>}{categoryId && <button onClick={() => update({ categoryId: "" })}>{selectedCategory?.name || "Kategori"} ×</button>}</div>}{loading ? <div className="store-loading">Ürünler yükleniyor…</div> : error ? <div className="catalog-empty" role="alert"><b>Katalog yüklenemedi</b><p>{error}</p><button onClick={() => window.location.reload()}>Tekrar dene</button></div> : data.products.length ? <div className="store-product-grid catalog-grid">{data.products.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="catalog-empty"><b>Sonuç bulunamadı</b><p>Filtreleri temizleyip tekrar deneyin.</p><button onClick={clearFilters}>Filtreleri temizle</button></div>}{data.pagination.totalPages > 1 && <div className="catalog-pagination"><button disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>← Önceki</button><span>{page} / {data.pagination.totalPages}</span><button disabled={page >= data.pagination.totalPages} onClick={() => update({ page: String(page + 1) })}>Sonraki →</button></div>}</section></div><SiteFooter/></main>;
}
