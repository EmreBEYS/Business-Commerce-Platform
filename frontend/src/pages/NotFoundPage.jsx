import { Link } from "react-router-dom";
import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";

export default function NotFoundPage() {
  return <main className="storefront"><SiteHeader /><section className="not-found-section"><div className="store-shell"><span>404</span><h1>Aradığınız sayfa bulunamadı.</h1><p>Bağlantı değişmiş veya sayfa kaldırılmış olabilir. Kataloğa dönerek ürünleri inceleyebilirsiniz.</p><div><Link className="store-button primary" to="/">Ana sayfaya dön <b>→</b></Link><Link className="store-button secondary" to="/katalog">Kataloğu aç <b>→</b></Link></div></div></section><SiteFooter /></main>;
}
