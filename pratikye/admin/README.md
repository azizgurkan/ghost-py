# pratikye Ghost Admin uzantısı

## Durum

Bu klasör, Ghost 6.68/6.69 için çalışan ilk admin editörü sürümünü içerir.

- `pratikye-admin.css`: Ghost native admin arayüzünü ezmeyen, `.pratikye-admin-*` kapsamındaki pratikye marka görünüm katmanı.
- `pratikye-admin.js`: Same-origin Ghost oturumuyla tarif arama/listeleme, sayfalama, yapılandırılmış JSON + HTML fallback okuma, alan düzenleme, güvenli önizleme ve `updated_at` concurrency kontrollü PUT güncellemesi.
- API anahtarı tarayıcıya gömülmez; script yalnızca Ghost oturum çerezini kullanır. Otomatik yayınlama veya status değiştirme kontrolü yoktur.

## Planlanan entegrasyon sözleşmesi

Gerçek sürüm tamamlandığında script, Ghost 6.68 / 6.69 admin içine `config.clientExtensions.script.src` ile yüklenecek ve yalnızca giriş yapılmış same-origin oturumu kullanacaktır:

- İstek kökü: `/ghost/api/admin/`
- `credentials: "same-origin"`
- `Accept-Version: v6.0` (veya Ghost varsayılanı için boş bırakılabilir)
- Tarayıcıya API key gömülmez; kimlik doğrulama Ghost cookie session üzerinden yapılır.
- `GET /posts/` browse, arama ve sayfalama; `GET /posts/:id/` için `formats=html,lexical&include=tags`.
- `PUT /posts/:id/?source=html` isteğinde `updated_at` concurrency alanı gönderilir. Taslak / mevcut status korunur; otomatik publish ve status değiştirme düğmesi bulunmaz.

## Tema / veri kısıtları

- `codeinjection_head` içindeki `id="pratikye-recipe"` JSON kaynağı önceliklidir; JSON yoksa tarif HTML'indeki `h2` bölümleri fallback olarak okunur.
- `sourceNote`, `collections`, `dietary` ve bilinmeyen JSON metadata anahtarları korunmalıdır.
- İlişkisiz Ghost etiketleri, code injection içeriği, özel alanlar ve açıklamanın tamamı korunmadan kaydetme yapılmamalıdır.
- Desteklenmeyen HTML blokları tespit edilirse kullanıcıya HTML önizlemesi ve açık inceleme onayı gösterilmeden kaydetme yapılmamalıdır.

## Ortam notu

`clientExtensions` ayarı Ghost config / admin config ortamından sağlanmalıdır. Script ve stil dosyaları Ghost admin tarafından erişilebilen bir URL'de barındırılmalı; `src` yalnızca güvenilen bir HTTPS veya aynı-origin kaynağa işaret etmelidir. Bu README tek başına `clientExtensions` ayarını değiştirmez.

## Test durumu

`node --check pratikye-admin.js` başarıyla geçer. Canlı Ghost API'sinin `site/`, `themes/` ve `settings/` uçları staff token ile doğrulanmıştır. Admin scripti canlı admin içine alınmadan önce `clientExtensions` ayarıyla güvenilir HTTPS kaynak olarak tanımlanmalıdır; mevcut tema yayına alınmış olsa da bu config değişikliği Railway/Ghost çalışma ortamı ayarıdır.
