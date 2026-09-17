import { Link } from "react-router-dom";
import { WHATSAPP_URL } from "../../lib/catalogApi";
import ProductImage from "./ProductImage";

function categoryIcon(category = "") {
  const value = category.toLocaleLowerCase("tr-TR");
  if (value.includes("işlemci")) return "◇";
  if (value.includes("ram")) return "▥";
  if (value.includes("disk") || value.includes("ssd") || value.includes("hdd")) return "◉";
  if (value.includes("network") || value.includes("switch") || value.includes("router")) return "⌁";
  if (value.includes("sunucu")) return "▤";
  return "⌘";
}

export default function ProductCard({product}) {
  const categoryPath = product.category_path || product.category || "Kurumsal donanım";
  const category = categoryPath.split(" > ").at(-1);
  const fallback = <div className="product-placeholder"><i>{categoryIcon(categoryPath)}</i><b>ServerSatış</b><small>{category}</small></div>;

  return <article className="store-product-card"><div className="store-product-image"><span>{product.brand || "Kurumsal"}</span><ProductImage src={product.image_url} alt={product.name} fallback={fallback}/></div><div className="store-product-body"><small>{categoryPath}</small><h3>{product.name}</h3><div className="store-product-meta"><span><i/> {product.availability === "OUT_OF_STOCK" ? "Tedarik için iletişime geçin" : "Global tedarik"}</span><b>Fiyat için teklif alın</b></div></div><div className="store-product-actions"><Link to={`/urun/${product.id}`}>Ürünü incele <span>→</span></Link><a href={`${WHATSAPP_URL}?text=${encodeURIComponent(`${product.name} ürünü hakkında bilgi almak istiyorum.`)}`} aria-label={`${product.name} için WhatsApp'tan bilgi alın`}>◔</a></div></article>;
}
