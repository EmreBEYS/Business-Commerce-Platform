import { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";
import { COMPANY_CONTACT, WHATSAPP_URL } from "../lib/catalogApi";

const pageContent = {
  about: {
    eyebrow: "SERVERSATIŞ HAKKINDA",
    title: <>Kurumsal altyapı için<br /><em>doğru teknoloji ortağı.</em></>,
    intro: "ServerSatış; sunucu, işlemci, bellek, depolama, network ekipmanı ve veri merkezi bileşenlerinde kurumsal ürün tedariki sunar.",
  },
  supply: {
    eyebrow: "TEDARİK SÜRECİ",
    title: <>İhtiyaçtan teslimata<br /><em>şeffaf ve kontrollü süreç.</em></>,
    intro: "Ürün eşleştirmeden teklif ve teslimata kadar her adımı uzman ekibimizle birlikte, açık iletişimle yönetiyoruz.",
  },
  contact: {
    eyebrow: "KURUMSAL İLETİŞİM",
    title: <>Projenizi konuşalım,<br /><em>doğru çözümü bulalım.</em></>,
    intro: "Ürün, uyumluluk, fiyat ve tedarik süresi hakkında uzman ekibimize doğrudan ulaşabilirsiniz.",
  },
};

function PageHero({ type }) {
  const content = pageContent[type];
  return (
    <section className="corporate-hero">
      <div className="corporate-grid" />
      <div className="store-shell corporate-hero-content">
        <div>
          <span>{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
        <div className="corporate-hero-mark" aria-hidden="true"><b>S</b><span>Kurumsal teknoloji<br />tedarik merkezi</span></div>
      </div>
    </section>
  );
}

function AboutContent() {
  return <>
    <section className="store-shell corporate-intro-section">
      <div><span className="section-kicker">BİZ KİMİZ?</span><h2>Ürün listesinin ötesinde,<br />uzman tedarik yaklaşımı.</h2></div>
      <div><p>Kurumsal donanım ihtiyaçlarında doğru ürüne ulaşmanın yalnızca model bulmak olmadığını biliyoruz. Uyumluluk, kapasite, iş yükü, teslim süresi ve bütçe gibi tüm değişkenleri birlikte değerlendiriyoruz.</p><p>Global tedarik ağımız ve ürün uzmanlığımızla sıfır ve yenilenmiş donanım seçeneklerini tek katalogda bir araya getiriyor; seçimden teslimata kadar müşterilerimizin yanında oluyoruz.</p></div>
    </section>
    <section className="corporate-values-section"><div className="store-shell">
      <div className="section-title"><div><span>ÇALIŞMA PRENSİPLERİMİZ</span><h2>Her projede aynı net yaklaşım</h2></div></div>
      <div className="corporate-value-grid">
        <article><i>01</i><b>Doğru ürün eşleştirme</b><p>Teknik ihtiyaçları dinler, uyumluluğu kontrol eder ve uygun alternatifleri sunarız.</p></article>
        <article><i>02</i><b>Şeffaf iletişim</b><p>Stok, tedarik süresi ve ürün durumu hakkında açık ve güncel bilgi paylaşırız.</p></article>
        <article><i>03</i><b>Global ürün erişimi</b><p>Geniş marka ve tedarik ağıyla zor bulunan kurumsal ürünlere erişim sağlarız.</p></article>
        <article><i>04</i><b>Kurumsal süreklilik</b><p>Tek seferlik satış yerine uzun vadeli altyapı ihtiyaçlarına odaklanırız.</p></article>
      </div>
    </div></section>
    <section className="store-shell corporate-numbers"><div><strong>2.700+</strong><span>Katalog ürünü</span></div><div><strong>40+</strong><span>Global marka</span></div><div><strong>7/24</strong><span>Kurumsal altyapı odağı</span></div></section>
  </>;
}

function SupplyContent() {
  const steps = [
    ["01", "İhtiyacı dinliyoruz", "Kullanım senaryosu, mevcut altyapı, kapasite ve bütçe bilgilerini netleştiriyoruz."],
    ["02", "Ürünü eşleştiriyoruz", "Model, parça numarası ve teknik uyumluluğu kontrol ederek uygun seçenekleri belirliyoruz."],
    ["03", "Tedarik seçeneklerini sunuyoruz", "Stok durumu, ürün kondisyonu, alternatifler ve tahmini teslim süresini paylaşıyoruz."],
    ["04", "Teklifi hazırlıyoruz", "İhtiyaca özel fiyatlandırmayı ve teslimat planını şeffaf biçimde oluşturuyoruz."],
    ["05", "Teslimatı takip ediyoruz", "Siparişten teslimata kadar süreci izliyor ve gerekli bilgilendirmeleri yapıyoruz."],
  ];
  return <>
    <section className="store-shell supply-section">
      <div className="section-title"><div><span>5 ADIMDA TEDARİK</span><h2>Her aşaması takip edilebilir</h2></div></div>
      <div className="supply-timeline">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>
    <section className="supply-check-section"><div className="store-shell supply-check-grid"><div><span className="section-kicker">TEKLİF ÖNCESİ KONTROLLER</span><h2>Doğru ürünü doğrulamak için</h2><p>Özellikle sunucu bileşenlerinde küçük bir uyumluluk farkı kritik olabilir. Bu nedenle teklif öncesinde temel teknik kontrolleri birlikte yaparız.</p></div><ul><li>Marka, model ve nesil uyumluluğu</li><li>Parça numarası ve form faktörü</li><li>Kapasite ve performans ihtiyacı</li><li>Stok ve tahmini teslim süresi</li><li>Sıfır veya yenilenmiş ürün seçeneği</li><li>Alternatif ürün değerlendirmesi</li></ul></div></section>
  </>;
}

function ContactContent() {
  const [form, setForm] = useState({ name: "", company: "", request: "" });

  const sendRequest = (event) => {
    event.preventDefault();
    const text = [
      "Merhaba, kurumsal ürün talebi oluşturmak istiyorum.",
      "Ad Soyad: " + form.name,
      "Firma: " + (form.company || "Belirtilmedi"),
      "Talep: " + form.request,
    ].join("\n");
    window.open(WHATSAPP_URL + "?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
  };

  return <section className="store-shell contact-section">
    <div className="contact-card-grid">
      <a href={COMPANY_CONTACT.phoneUrl}><i>☎</i><span><small>TELEFON</small><b>{COMPANY_CONTACT.phoneDisplay}</b><em>Hemen arayın →</em></span></a>
      <a href={`mailto:${COMPANY_CONTACT.email}`}><i>✉</i><span><small>E-POSTA</small><b>{COMPANY_CONTACT.email}</b><em>E-posta gönderin →</em></span></a>
      <a href={WHATSAPP_URL}><i>◉</i><span><small>WHATSAPP</small><b>0544 617 61 44</b><em>Uzmanımıza yazın →</em></span></a>
    </div>
    <div className="contact-details">
      <div><span className="section-kicker">ADRES & ÇALIŞMA</span><h2>İstanbul&apos;dan Türkiye&apos;ye<br />kurumsal tedarik.</h2><p>{COMPANY_CONTACT.addressLine1}<br />{COMPANY_CONTACT.addressLine2}</p><dl><div><dt>Telefon</dt><dd><a href={COMPANY_CONTACT.phoneUrl}>{COMPANY_CONTACT.phoneDisplay}</a></dd></div><div><dt>E-posta</dt><dd><a href={`mailto:${COMPANY_CONTACT.email}`}>{COMPANY_CONTACT.email}</a></dd></div><div><dt>Web</dt><dd><a href={COMPANY_CONTACT.website} target="_blank" rel="noreferrer">{COMPANY_CONTACT.websiteDisplay}</a></dd></div></dl></div>
      <aside><span>PROJENİZ İÇİN HIZLI İLETİŞİM</span><h3>Aradığınız ürünü birlikte bulalım.</h3><p>Model veya parça numarasını paylaşın; stok, alternatif ve tedarik seçeneklerini inceleyelim.</p><a href={WHATSAPP_URL}>WhatsApp&apos;tan iletişime geçin <b>↗</b></a></aside>
    </div>
    <form className="contact-quick-form" onSubmit={sendRequest}>
      <div><span className="section-kicker">HIZLI TALEP</span><h2>İhtiyacınızı birkaç cümleyle anlatın.</h2><p>Bilgileriniz sitede kaydedilmez; gönderdiğinizde WhatsApp görüşmesi güvenli biçimde açılır.</p></div>
      <div>
        <label>Ad Soyad<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Firma<input maxLength="120" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label>
        <label className="full">Ürün veya proje ihtiyacı<textarea required minLength="10" maxLength="1000" rows="5" value={form.request} onChange={(event) => setForm({ ...form, request: event.target.value })} /></label>
        <button type="submit">WhatsApp üzerinden gönder <span>↗</span></button>
      </div>
    </form>
  </section>;
}

export default function CorporatePage({ type }) {
  return <main className="storefront"><SiteHeader /><PageHero type={type} />
    {type === "about" && <AboutContent />}
    {type === "supply" && <SupplyContent />}
    {type === "contact" && <ContactContent />}
    {type !== "contact" && <section className="corporate-cta"><div className="store-shell"><div><span>PROJENİZİ KONUŞALIM</span><h2>İhtiyacınıza uygun ürünü birlikte bulalım.</h2></div><div><Link to="/iletisim">İletişim bilgileri <span>→</span></Link><a href={WHATSAPP_URL}>WhatsApp <span>↗</span></a></div></div></section>}
    <SiteFooter />
  </main>;
}
