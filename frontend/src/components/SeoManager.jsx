import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeMeta = {
  "/": ["ServerSatış | Kurumsal Teknoloji Kataloğu", "Sunucu, ağ ve veri merkezi ekipmanlarında kurumsal ürün tedariki."],
  "/katalog": ["Ürün Kataloğu | ServerSatış", "Binlerce sunucu, işlemci, bellek, depolama ve network ürününü keşfedin."],
  "/hakkimizda": ["Hakkımızda | ServerSatış", "ServerSatış kurumsal teknoloji tedarik yaklaşımı ve çalışma prensipleri."],
  "/tedarik-sureci": ["Tedarik Süreci | ServerSatış", "İhtiyaç analizinden teslimata kadar şeffaf kurumsal teknoloji tedarik süreci."],
  "/iletisim": ["Kurumsal İletişim | ServerSatış", "Ürün, fiyat ve tedarik seçenekleri için ServerSatış uzmanlarına ulaşın."],
  "/kvkk": ["KVKK Aydınlatma Metni | ServerSatış", "ServerSatış kişisel verilerin işlenmesine ilişkin aydınlatma metni."],
  "/gizlilik": ["Gizlilik Politikası | ServerSatış", "ServerSatış internet sitesi gizlilik politikası."],
  "/cerez-politikasi": ["Çerez Politikası | ServerSatış", "ServerSatış sitesinde kullanılan zorunlu teknolojiler hakkında bilgi."],
  "/kullanim-kosullari": ["Kullanım Koşulları | ServerSatış", "ServerSatış internet sitesi kullanım koşulları."],
};

function setMeta(name, content, attribute = "name") {
  let element = document.head.querySelector('meta[' + attribute + '="' + name + '"]');
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const exact = routeMeta[pathname];
    const fallback = pathname.startsWith("/urun/")
      ? ["Ürün Detayı | ServerSatış", "Kurumsal ürün bilgileri, uyumluluk ve tedarik seçenekleri."]
      : pathname.startsWith("/kategori/")
        ? ["Kategori | ServerSatış", "Kurumsal teknoloji ürünlerini kategoriye göre inceleyin."]
        : pathname.startsWith("/admin")
          ? ["Yönetim Paneli | ServerSatış", "ServerSatış güvenli yönetim paneli."]
          : ["Sayfa Bulunamadı | ServerSatış", "Aradığınız sayfa bulunamadı."];
    const [title, description] = exact || fallback;
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const canonicalUrl = siteUrl.replace(/\/$/, "") + pathname;

    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", canonicalUrl, "property");

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [pathname]);
  return null;
}
