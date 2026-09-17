import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";
import ProductImage from "../components/storefront/ProductImage";
import { getProduct, WHATSAPP_URL } from "../lib/catalogApi";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getProduct(id)
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [id]);

  if (error) {
    return <main className="storefront"><SiteHeader/><div className="catalog-empty detail-empty"><b>Ürün bulunamadı</b><Link to="/katalog">Kataloğa dön</Link></div><SiteFooter/></main>;
  }
  if (!product) return <div className="store-loading full">Ürün yükleniyor…</div>;

  const placeholder = <div className="product-placeholder detail-placeholder"><i>▤</i><b>ServerSatış</b><small>Kurumsal ürün</small></div>;
  const message = encodeURIComponent(`${product.name} ürünü hakkında fiyat ve tedarik bilgisi almak istiyorum.`);
  const category = product.category_path || product.category;

  return <main className="storefront"><SiteHeader/><div className="detail-breadcrumb"><div className="store-shell"><Link to="/">Ana Sayfa</Link><span>›</span><Link to="/katalog">Katalog</Link><span>›</span><b>{product.brand}</b></div></div><section className="store-shell product-detail"><div className="detail-image"><span>{product.brand}</span><ProductImage src={product.image_url} alt={product.name} fallback={placeholder}/></div><div className="detail-copy"><span className="detail-category">{category}</span><h1>{product.name}</h1><div className="detail-badges"><span>● Global tedarik</span><span>✓ Uzman kontrolü</span><span>◇ Kurumsal ürün</span></div><div className="offer-box"><small>FİYAT VE TEDARİK BİLGİSİ</small><b>Projenize özel teklif alın</b><p>Güncel tedarik süresi, uyumluluk ve fiyat bilgisi için uzmanımızla iletişime geçin.</p></div><a className="detail-whatsapp" href={`${WHATSAPP_URL}?text=${message}`}><span>◔</span><div><small>Bu ürün hakkında bilgi alın</small><b>WhatsApp&apos;tan uzmanımıza ulaşın</b></div><i>↗</i></a></div></section><section className="detail-description"><div className="store-shell"><article><span>ÜRÜN AÇIKLAMASI</span><h2>Kurumsal altyapınız için güçlü çözüm</h2><p>{product.description || "Bu ürün hakkında ayrıntılı teknik bilgi ve tedarik seçenekleri için uzman ekibimizle iletişime geçebilirsiniz."}</p></article><aside><b>Ürün bilgileri</b><dl><div><dt>Marka</dt><dd>{product.brand}</dd></div><div><dt>Kategori</dt><dd>{category}</dd></div><div><dt>Ürün kodu</dt><dd>{product.id.slice(0, 8).toUpperCase()}</dd></div><div><dt>Tedarik</dt><dd>{product.availability === "OUT_OF_STOCK" ? "Sipariş üzerine" : "Talep üzerine"}</dd></div></dl></aside></div></section><SiteFooter/></main>;
}
