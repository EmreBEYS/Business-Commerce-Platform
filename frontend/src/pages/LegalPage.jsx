import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";
import { COMPANY_CONTACT } from "../lib/catalogApi";

const content = {
  kvkk: {
    label: "KİŞİSEL VERİLER",
    title: "KVKK Aydınlatma Metni",
    intro: "ServerSatış, kendisine iletilen kişisel verileri 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, belirli ve meşru amaçlarla işler.",
    sections: [
      ["İşlenen veriler", "İletişim kanallarımızı kullandığınızda ad-soyad, telefon, e-posta, firma bilgisi ve talep içeriğiniz işlenebilir."],
      ["İşleme amaçları", "Taleplerin yanıtlanması, teklif hazırlanması, ürün ve tedarik iletişiminin yürütülmesi, güvenlik ve yasal yükümlülüklerin yerine getirilmesi."],
      ["Aktarım ve saklama", "Veriler yalnızca hizmetin yürütülmesi için gerekli tedarikçi ve hizmet sağlayıcılarla, hukuki şartlara uygun olarak paylaşılabilir ve amaç için gereken süre boyunca saklanır."],
      ["Haklarınız", "Verilerinizin işlenip işlenmediğini öğrenme, düzeltme, silme veya yok etme talep etme ve kanuni diğer haklarınızı kullanma hakkınız vardır."],
    ],
  },
  privacy: {
    label: "GİZLİLİK",
    title: "Gizlilik Politikası",
    intro: "Ziyaretçilerimizin ve kurumsal müşterilerimizin bilgilerini yalnızca talep edilen hizmeti sunmak ve güvenli iletişim kurmak amacıyla kullanırız.",
    sections: [
      ["Toplanan bilgiler", "Site kullanımı sırasında doğrudan form ile veri toplamıyoruz. Telefon, e-posta veya WhatsApp üzerinden paylaştığınız bilgiler ilgili kanalın koşullarına da tabidir."],
      ["Güvenlik", "Yönetim paneli erişimi şifreli oturum çerezi, yetki kontrolü ve giriş deneme sınırıyla korunur."],
      ["Üçüncü taraf bağlantıları", "WhatsApp ve harici web bağlantıları kendi gizlilik politikalarına tabidir."],
      ["İletişim", "Gizlilik taleplerinizi aşağıdaki e-posta adresi üzerinden bize iletebilirsiniz."],
    ],
  },
  cookies: {
    label: "ÇEREZLER",
    title: "Çerez Politikası",
    intro: "Katalogun herkese açık bölümünde reklam veya izleme çerezi kullanılmaz. Yönetim panelinde yalnızca güvenli oturum için zorunlu çerez kullanılır.",
    sections: [
      ["Zorunlu çerez", "admin_token adlı HTTP-only çerez, yöneticinin güvenli oturumunu sürdürmek amacıyla kullanılır ve en fazla 8 saat geçerlidir."],
      ["Analiz ve reklam", "Mevcut sürümde analiz, reklam veya davranışsal takip çerezi bulunmaz."],
      ["Tarayıcı ayarları", "Çerezleri tarayıcı ayarlarınızdan silebilirsiniz; zorunlu çerezin engellenmesi yönetim paneli girişini etkiler."],
    ],
  },
  terms: {
    label: "KULLANIM",
    title: "Kullanım Koşulları",
    intro: "Bu site kurumsal teknoloji ürünlerini tanıtmak ve teklif taleplerini ilgili ekibe yönlendirmek amacıyla sunulur.",
    sections: [
      ["Katalog bilgileri", "Ürün bilgileri genel bilgilendirme amaçlıdır. Nihai stok, ürün durumu, uyumluluk, fiyat ve teslim süresi yazılı teklif ile kesinleşir."],
      ["Fikri haklar", "Site tasarımı, metinleri ve marka unsurları izin alınmadan ticari amaçla çoğaltılamaz."],
      ["Sorumluluk", "Harici bağlantılar ve üçüncü taraf hizmetleri kendi kullanım şartlarına tabidir."],
      ["Güncellemeler", "Koşullar ihtiyaç hâlinde güncellenebilir. Güncel metin bu sayfada yayımlanır."],
    ],
  },
};

export default function LegalPage({ type }) {
  const page = content[type];
  return <main className="storefront"><SiteHeader /><section className="legal-hero"><div className="store-shell"><span>{page.label}</span><h1>{page.title}</h1><p>{page.intro}</p></div></section><section className="store-shell legal-content">{page.sections.map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}<aside><b>Başvuru ve iletişim</b><p>Talebinizi <a href={"mailto:" + COMPANY_CONTACT.email}>{COMPANY_CONTACT.email}</a> adresine iletebilirsiniz.</p><small>Son güncelleme: 18 Eylül 2026</small></aside></section><SiteFooter /></main>;
}
