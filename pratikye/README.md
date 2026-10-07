# pratikye CMS yenilemesi

Bu klasör, `cms.pratikye.com` için hazırlanmış Ghost temasını ve tarif düzenleme admin uzantısını içerir.

## İçerik

- `theme/`: pratikye landing page, arşiv, cihaz/kategori hub'ları, tarif detayları, favoriler ve responsive tasarım.
- `admin/`: Ghost admin içine eklenen tarif listesi ve düzenleme paneli. Admin scripti API anahtarı taşımaz; Ghost oturum çerezini kullanır.
- `scripts/build-theme-zip.mjs`: Ghost'a yüklenebilir zip üretir.
- `scripts/apply-theme.mjs`: Admin API yetkili anahtarıyla temayı yükler ve etkinleştirir.
- `scripts/apply-branding.mjs`: site adı, açıklama, favicon, vurgu rengi, dil ve saat dilimini günceller.

## Tema kurulumu

```bash
node pratikye/scripts/build-theme-zip.mjs
GHOST_URL=https://cms.pratikye.com \
GHOST_ADMIN_API_KEY=id:secret \
node pratikye/scripts/apply-theme.mjs
```

Tema etkinleştirme geri alınabilir: Ghost Admin → Settings → Design içinden önceki temayı seçin. Script içerik postlarını değiştirmez.

## Admin uzantısı

`admin/pratikye-admin.js` dosyasını Ghost admin'in erişebildiği HTTPS bir kaynağa koyun ve Ghost/Railway config'e şu değerleri tanımlayın:

```text
clientExtensions__script__src=https://<güvenilir-host>/pratikye-admin.js
clientExtensions__script__container=<div id="pratikye-admin-slot"></div>
```

Bu yapılandırma, admin oturumuna sahip kullanıcılar için “Tarif editörü” düğmesini gösterir. Kaydetme öncesi HTML önizlemesi ve checkbox onayı vardır; status otomatik değiştirilmez veya post yayınlanmaz. İlişkisiz etiketler ve yapılandırılmış tarif JSON'ı korunur.

## Doğrulama

```bash
node --check pratikye/admin/pratikye-admin.js
node --check pratikye/scripts/apply-theme.mjs
node pratikye/scripts/build-theme-zip.mjs
```

API anahtarlarını repoya veya frontend dosyalarına koymayın.
