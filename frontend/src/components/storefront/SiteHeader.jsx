import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProducts, WHATSAPP_URL } from "../../lib/catalogApi";

const menuCategories = [
  { name: "Sunucular", icon: "▤", slug: "sunucular", detail: "Rack, tower ve GPU sunucular" },
  { name: "İşlemciler", icon: "◇", slug: "islemciler", detail: "Intel Xeon ve AMD EPYC" },
  { name: "Sunucu Ramleri", icon: "▥", slug: "sunucu-ramleri", detail: "DDR3, DDR4 ve DDR5 ECC" },
  { name: "Sunucu Diskleri", icon: "◉", slug: "sunucu-diskleri", detail: "SSD, NVMe ve SAS" },
  { name: "Network Ekipmanları", icon: "⌁", slug: "network-ekipmanlari", detail: "Switch, router ve firewall" },
  { name: "Sunucu Bileşenleri", icon: "⌘", slug: "sunucu-bilesenleri", detail: "Kartlar, güç ve aksesuar" },
];

export default function SiteHeader() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [menuProducts, setMenuProducts] = useState([]);
  useEffect(() => {
    getProducts({ limit: 3, sort: "newest" }).then((data) => setMenuProducts(data.products || [])).catch(() => setMenuProducts([]));
  }, []);
  const submit = (event) => {
    event.preventDefault();
    navigate(`/katalog${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };
  return <>
    <div className="store-topbar"><div className="store-shell"><span><i /> Global tedarik ağı · Kurumsal çözümler</span><a href={WHATSAPP_URL}>WhatsApp desteği ↗</a></div></div>
    <header className="store-header">
      <div className="store-shell header-main">
        <Link className="store-brand" to="/" aria-label="ServerSatış ana sayfa"><img src="/serversatis-logo.png" alt="ServerSatış"/></Link>
        <form className="store-search" onSubmit={submit}><span>⌕</span><input value={query} onChange={(event)=>setQuery(event.target.value)} aria-label="Katalogda ara" placeholder="Ürün, model, parça numarası veya marka ara..."/><button>Ara</button></form>
        <a className="expert-link" href={WHATSAPP_URL}><span>●</span><span><small>Uzman desteği</small><b>WhatsApp&apos;tan yazın</b></span></a>
      </div>
      <nav className="store-nav"><div className="store-shell"><div className="mega-trigger"><Link className="all-categories" to="/katalog">☷ &nbsp; Tüm Kategoriler <span>⌄</span></Link><div className="mega-menu"><div className="mega-categories">{menuCategories.map((item)=><Link className="mega-category" to={`/kategori/${item.slug}`} key={item.name}><i>{item.icon}</i><span><b>{item.name}</b><small>{item.detail}</small></span><em>→</em></Link>)}</div><div className="mega-featured"><div className="mega-heading"><span>ÖNE ÇIKAN ÜRÜNLER</span><Link to="/katalog">Tümünü gör →</Link></div><div className="mega-products">{menuProducts.length?menuProducts.map((product)=><Link className="mega-product" to={`/urun/${product.id}`} key={product.id}><span>{product.image_url?<img src={product.image_url} alt=""/>:<b>SS</b>}</span><small>{product.brand}</small><strong>{product.name}</strong></Link>):<><Link className="mega-product" to="/kategori/sunucular"><span><b>▤</b></span><small>SUNUCU</small><strong>Kurumsal rack sunucu çözümleri</strong></Link><Link className="mega-product" to="/kategori/islemciler"><span><b>◇</b></span><small>İŞLEMCİ</small><strong>Intel Xeon ve AMD EPYC</strong></Link><Link className="mega-product" to="/kategori/sunucu-diskleri"><span><b>◉</b></span><small>DEPOLAMA</small><strong>SSD, NVMe ve SAS diskler</strong></Link></>}</div></div></div></div><Link to="/kategori/sunucular">Sunucular</Link><Link to="/kategori/islemciler">İşlemciler</Link><Link to="/kategori/sunucu-ramleri">Bellek</Link><Link to="/kategori/sunucu-diskleri">Depolama</Link><Link to="/kategori/network-ekipmanlari">Network</Link><Link to="/kategori/sunucu-bilesenleri">Bileşenler</Link><Link className="company-nav" to="/hakkimizda">Kurumsal</Link></div></nav>
    </header>
  </>;
}
