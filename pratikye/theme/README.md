# pratikye teması

**pratikye** — akıllı cihazlarla pratik yemek. Bu tema, pratikye tarif arşivini (Shark Ninja Combi ve Instant Pot koleksiyonları) sıcak, editoryal bir düzenle sunar.

## Tasarım dili

pratikye'nin **“Akdeniz Pazar Defteri + Cihaz Hazır”** yönünü izler:

- **Renkler:** sıcak krem `#fffaf0`, kömür `#22251f`, Köz Kırmızısı `#cf3d35`, biberiye yeşili `#3f6b4a`, safran `#f0b64b`.
- **Tipografi:** başlıklarda Fraunces (serif), gövdede DM Sans, ayar/etiketlerde DM Mono.
- **İmza öğeler:** kartlarda cihaz rozetleri ve yumuşak köşeli chip'ler; tarif detayında krem cihaz-ayarları paneli, yeşil çerçeveli malzeme listesi ve numaralı adımlar.

## Sayfalar

| Şablon | Kullanım |
| --- | --- |
| `home.hbs` | Ana sayfa (landing): hero, cihaz seçimi, kategoriler, öne çıkanlar, katalog ve koleksiyon şeridi |
| `index.hbs` | Tarif arşivi (tüm tarifler, sayfalama) |
| `post.hbs` | Tarif detayı: cihaz ayarları paneli, malzemeler, adımlar, ipucu, SSS, benzer tarifler |
| `tag.hbs` | Cihaz ve kategori arşivleri |
| `page.hbs`, `author.hbs`, `error.hbs` | Bilgi sayfaları, yazar arşivi ve hata sayfaları |

## Tarif gönderisi sözleşmesi

Tema, tarif gönderilerinin şu yapıyla yazılmasını bekler (pratikye içerik sözleşmesi):

- Etiketler: `cihaz:shark-ninja-combi` veya `cihaz:instant-pot`; `kategori:<ad>`; `durum:verified` / `durum:needs-review`.
- Gövde başlıkları: `Malzemeler`, `Yapılış`, `Cihaz ayarları` (Program / Süre / Sıcaklık / Porsiyon / Aksesuar satırları), isteğe bağlı `İpucu`, `Besin değerleri`, `Sıkça sorulan sorular`.
- Özet: kart ve meta açıklaması için **Özel özet (custom excerpt)** alanı.

JavaScript kapalıyken tüm içerik okunabilir kalır; cihaz ayarları paneli, iki kolonlu malzeme/adım düzeni ve favoriler gibi zenginleştirmeler JS ile uygulanır.

## Favoriler

Favoriler tarayıcıda `localStorage` üzerinde tutulur (`pratikye:favorites`); sunucuya gönderilmez, kişisel veri saklanmaz.

## Kurulum

Kurulum, ortam değişkenleri ve yönetim paneli görünümü için depodaki `pratikye/README.md` ve `pratikye/docs/kurulum.md` dosyalarına bakın.
