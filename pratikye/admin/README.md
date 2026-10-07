# pratikye Ghost Admin uzantısı

## Durum

Bu klasör, Ghost 6.68/6.69 için çalışan ilk admin editörü sürümünü içerir.

- `pratikye-admin.css`: Ghost native admin arayüzünü ezmeyen, `.pratikye-admin-*` kapsamındaki pratikye marka görünüm katmanı.
- `pratikye-admin.js`: Same-origin Ghost oturumuyla tarif arama/listeleme, sayfalama, yapılandırılmış JSON + HTML fallback okuma, alan düzenleme, güvenli önizleme ve `updated_at` concurrency kontrollü PUT güncellemesi. Jamm değerlendirmesine göre popup/üst çubuk butonu kaldırıldı; erişim, Ghost sol menüsünde **View site ile Posts arasında** `Tarif editörü` sayfa öğesi olarak açılır ve editör Ghost'un sağ içerik alanına mount edilir.
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

`node --check pratikye-admin.js` başarıyla geçer. Canlı Ghost config kontrolünde `clientExtensions.script.src` değerinin `https://cdn.jsdelivr.net/gh/azizgurkan/ghost-py@main/pratikye/admin/pratikye-admin.js` olduğu doğrulandı. jsDelivr `@main` kaynağını önbelleklediği için repo, admin JS/CSS değişikliklerinden sonra `purge.jsdelivr.net` çağıran GitHub Actions workflow'u içerir; Railway URL'si bundan sonra değişmez. Jamm kaydı: “Moving Tarif editörü to sidebar” (90fa8317-8f03-4477-8263-0eae228587a4).

## Jam bbc3c088 düzeltmesi

Jam `tarif editörü - güncelleme 2` kaydında sorun, linkin Ghost router'ına bilinmeyen bir sayfa rotası olarak bırakılması ve editör kökünün `position: fixed` ile tüm admin yüzeyine katmanlanmasıydı. Link artık click capture ile kendi hash rotasını yönetiyor; menü sabit kalıyor, root `main`/content host içine ekleniyor ve Labs görünürlüğü localStorage anahtarıyla açılıp kapanabiliyor. Jam'deki iki ActivityPub `404` isteği bu UI hatasının nedeni değil; Ghost'ta etkin olmayan ActivityPub bildirim endpoint'inin bağımsız, beklenen 404'leridir.
