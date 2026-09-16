import { Link } from "react-router-dom";
import { WHATSAPP_URL } from "../../lib/catalogApi";

function categoryIcon(category = "") {
  const value = category.toLocaleLowerCase("tr-TR");
  if (value.includes("işlemci")) return "◇";
  if (value.includes("ram")) return "▥";
  if (value.includes("disk") || value.includes("ssd") || value.includes("hdd")) return "◉";
  if (value.includes("network") || value.includes("switch") || value.includes("router")) return "⌁";
  if (value.includes("sunucu")) return "▤";
  return "⌘";
}

export default function ProductCard({product}){const category=(product.category || "Kurumsal donanım").split(" > ").at(-1);return <article className="store-product-card"><div className="store-product-image"><span>{product.brand || "Kurumsal"}</span>{product.image_url?<img src={product.image_url} alt={product.name}/>:<div className="product-placeholder"><i>{categoryIcon(product.category)}</i><b>ServerSatış</b><small>{category}</small></div>}</div><div className="store-product-body"><small>{category}</small><h3>{product.name}</h3><div className="store-product-meta"><span><i/> Global tedarik</span><b>Fiyat için iletişime geçin</b></div></div><div className="store-product-actions"><Link to={`/urun/${product.id}`}>Ürünü incele <span>→</span></Link><a href={WHATSAPP_URL} aria-label={`${product.name} için WhatsApp'tan bilgi alın`}>◔</a></div></article>}
