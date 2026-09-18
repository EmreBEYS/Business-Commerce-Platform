# ServerSatış Katalog ve Yönetim Paneli

## Çalıştırma

Backend:

```bash
cd backend
npm install
npm run db:setup-admins
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

- Katalog: `http://localhost:5173`
- Admin girişi: `http://localhost:5173/admin/login`

## Yönetici hesapları

İlk kurulum komutu `admin_users` tablosunu oluşturur ve backend `.env` dosyasındaki mevcut admin hesabını **Ana Yönetici** olarak güvenli şifre hash'iyle kaydeder.

Ana yönetici giriş yaptıktan sonra panelde **Yöneticiler** menüsünden iki ayrı hesap daha oluşturabilir. Sistem aynı anda en fazla üç aktif yöneticiye izin verir. Normal yöneticiler ürün ve kategori yönetebilir; yalnız ana yönetici hesap oluşturabilir veya diğer yönetici hesaplarını devre dışı bırakabilir.

Şifreler veritabanında hiçbir zaman düz metin tutulmaz.

## Kontroller

```bash
cd backend && npm test
cd frontend && npm run lint && npm run build
```


## Canlı ortam kontrol listesi

- Kök dizindeki .env.example değerlerini gerçek ortama göre doldurun; gizli değerleri Git'e eklemeyin.
- NODE_ENV=production, güçlü bir JWT_SECRET, gerçek FRONTEND_URL, VITE_API_URL ve VITE_SITE_URL kullanın.
- Site ve API'yi HTTPS üzerinden yayınlayın.
- PostgreSQL bağlantısında barındırma sağlayıcınız gerektiriyorsa TLS/SSL etkinleştirin.
- backend/uploads/products klasörünü kalıcı diske bağlayın ve düzenli yedekleyin.
- Veritabanı ile ürün görsellerini aynı yedekleme planına dahil edin.
- Alan adı kesinleştiğinde sitemap dosyasını gerçek alan adıyla üretin.
- Canlıya çıkmadan önce şirket unvanı ve hukuki metinleri yetkili kişiyle doğrulayın.
