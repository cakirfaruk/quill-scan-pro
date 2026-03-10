# Astro Social — Proje Tanıtım Dokümantasyonu

## 📌 Genel Bakış

**Astro Social**, astroloji/fal, eşleşme/dating ve sosyal medya özelliklerini tek bir platformda birleştiren kapsamlı bir web uygulamasıdır. Kullanıcılar el yazısı analizi, numeroloji, doğum haritası, tarot, kahve falı gibi mistik analizler yapabilir; astrolojik uyuma dayalı eşleşme sistemini kullanabilir; ve sosyal medya benzeri bir ortamda içerik paylaşabilir.

- **Uygulama Adı:** Astro Social
- **Canonical URL:** https://analiz.sebanyazilim.com/
- **Published URL:** https://quill-scan-pro.lovable.app
- **Proje ID:** f3a23c96-de72-4efd-8bdb-943c8b98a400

---

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite (PWA desteği ile) |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| State Management | TanStack React Query |
| Routing | React Router DOM v6 |
| Backend / BaaS | Lovable Cloud (Supabase tabanlı) |
| Authentication | Supabase Auth (Email + Password) |
| Database | PostgreSQL (Supabase) |
| Edge Functions | Deno (Supabase Edge Functions) |
| AI Modelleri | Lovable AI (Gemini, GPT) — API key gerektirmez |
| Charts | Recharts |
| Animations | Framer Motion (lazy loaded) |
| Forms | React Hook Form + Zod validation |
| Icons | Lucide React |
| PWA | vite-plugin-pwa + Workbox |

---

## 🏗 Proje Mimarisi

```
src/
├── assets/              # Statik görseller (tarot kartları vb.)
├── components/          # UI bileşenleri (~120+ bileşen)
│   ├── ui/              # shadcn/ui temel bileşenleri
│   ├── feed/            # Feed ile ilgili bileşenler
│   └── layout/          # Layout bileşenleri (MainLayout)
├── contexts/            # React Context (AuthContext)
├── hooks/               # Custom hooks (~30+ hook)
├── integrations/        # Supabase client & types (otomatik üretilir)
├── pages/               # Route sayfaları (~25+ sayfa)
├── types/               # TypeScript tip tanımları
└── utils/               # Yardımcı fonksiyonlar

supabase/
├── config.toml          # Supabase yapılandırması (otomatik)
└── functions/           # Edge Functions (~15+ fonksiyon)

public/
├── sw.js                # Service Worker (PWA)
├── manifest.json        # PWA manifest
└── ...                  # Favicon, ikonlar
```

---

## 📱 Özellikler

### 1. Analiz & Fal Modülleri (9 Tür)

| Analiz Türü | Açıklama | Edge Function |
|-------------|----------|---------------|
| **El Yazısı Analizi** | 13 farklı konuda grafologi tabanlı kişilik analizi | `analyze-handwriting` |
| **Numeroloji** | İsim ve doğum tarihinden sayısal analiz | `analyze-numerology` |
| **Doğum Haritası** | Astrolojik natal chart analizi (ephemeris kütüphanesi) | `analyze-birth-chart` |
| **Uyum Analizi** | İki kişinin el yazısı karşılaştırması | `analyze-compatibility` |
| **Tarot Falı** | 22 Major Arcana kart yorumu | `analyze-tarot` |
| **Kahve Falı** | 3 fotoğraftan fincan yorumu | `analyze-coffee-fortune` |
| **Rüya Yorumu** | Metin tabanlı rüya analizi | `interpret-dream` |
| **El Falı (Palmistry)** | Avuç içi fotoğrafından çizgi analizi | `analyze-palmistry` |
| **Günlük Burç Yorumu** | AI destekli günlük burç | `generate-daily-horoscope` |

**Analiz Konuları (El Yazısı):**
Genel Kişilik, Duygusal Zeka, Sosyal Beceriler, Zihinsel Kapasite, İş Hayatı Profili, İletişim Tarzı, Karar Verme, Stres Yönetimi, Yaratıcılık, Liderlik Özellikleri, Detaycılık, Risk Alma Eğilimi, Empati Düzeyi

### 2. Sosyal Medya Platformu

- **Feed:** Post paylaşımı, beğeni, yorum, repost, quote post
- **Hikayeler (Stories):** 24 saat süreli hikaye paylaşımı
- **Reels:** Video paylaşımı ve izleme
- **Mesajlaşma:** Gerçek zamanlı DM, sesli mesaj, GIF desteği, zamanlı mesaj
- **Gruplar:** Grup sohbeti, duyurular, etkinlikler, anketler, dosya paylaşımı
- **Keşfet:** Trend hashtagler, öne çıkan içerikler
- **Arkadaşlık:** Arkadaş ekleme, öneri sistemi, yakın arkadaşlar, BFF modu
- **Profil:** Fotoğraf galerisi, drag-and-drop sıralama, bio, rozet gösterimi

### 3. Eşleşme / Dating Sistemi

- **Astrolojik Uyum Skoru:** Doğum haritasına dayalı uyum hesaplama
- **Swipe Mekanizması:** Tinder benzeri sağ/sol kaydırma
- **Filtreler:** Yaş, cinsiyet, burç, element, konum
- **Super Like / Boost / Undo:** Premium eşleşme özellikleri
- **Ice Breaker Soruları:** Eşleşme sonrası sohbet başlatıcılar
- **Sanal Hediyeler:** Eşleşmelere hediye gönderme
- **Buluşma Paylaşımı (Share My Date):** Güvenlik için buluşma bilgisi paylaşma

### 4. Gamification Sistemi

- **Kredi Sistemi:** Analizler için kredi tüketimi, başlangıçta 10 ücretsiz kredi
- **XP & Seviye:** Aktivitelere göre deneyim puanı ve seviye atlama
- **Rozetler:** 20+ farklı rozet (analiz sayısı, sosyal etkileşim vb.)
- **Günlük Görevler:** Kredi ve XP ödüllü günlük misyonlar
- **Arkadaş Serileri (Streaks):** Düzenli etkileşim takibi
- **Liderlik Tablosu:** Haftalık/aylık sıralama
- **Lig Sistemi:** Rekabetçi lig yapısı
- **Flash Fırsatlar:** Süre sınırlı indirimli kredi paketleri

### 5. İletişim & Arama

- **Sesli/Görüntülü Arama:** WebRTC tabanlı 1-1 arama
- **Grup Aramaları:** Çoklu katılımcılı görüntülü görüşme
- **Ekran Paylaşımı:** Arama sırasında ekran paylaşımı
- **Arama Geçmişi:** Detaylı arama kayıtları

### 6. PWA & Offline

- **Progressive Web App:** Yüklenebilir uygulama deneyimi
- **Offline Desteği:** Service Worker ile çevrimdışı kullanım
- **Push Bildirimleri:** VAPID tabanlı web push notifications
- **Offline Senkronizasyon:** Çevrimdışı yapılan işlemlerin otomatik senkronizasyonu

---

## 🗄 Veritabanı Yapısı

### Ana Tablolar

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri (bio, avatar, burç, konum vb.) |
| `analysis_history` | Genel analiz geçmişi |
| `birth_chart_analyses` | Doğum haritası analizleri |
| `compatibility_analyses` | Uyum analizleri |
| `palmistry_readings` | El falı okumaları |
| `coffee_fortune_readings` | Kahve falı okumaları |
| `dream_interpretations` | Rüya yorumları |
| `daily_horoscopes` | Günlük burç yorumları |
| `numerology_analyses` | Numeroloji analizleri |
| `tarot_readings` | Tarot okumaları |

### Sosyal Tablolar

| Tablo | Açıklama |
|-------|----------|
| `posts` | Kullanıcı paylaşımları |
| `post_comments` | Yorum sistemi |
| `post_likes` | Beğeni sistemi |
| `stories` | Hikayeler |
| `friends` | Arkadaşlık ilişkileri |
| `close_friends` | Yakın arkadaşlar |
| `friend_streaks` | Arkadaş serileri |
| `messages` | Özel mesajlar |
| `groups` | Grup tanımları |
| `group_members` | Grup üyelikleri |
| `group_messages` | Grup mesajları |

### Eşleşme Tabloları

| Tablo | Açıklama |
|-------|----------|
| `matches` | Eşleşme kayıtları |
| `match_preferences` | Eşleşme tercihleri (yaş, burç, cinsiyet) |
| `virtual_gifts` | Sanal hediye tanımları |
| `gift_transactions` | Hediye gönderim kayıtları |
| `date_shares` | Buluşma paylaşımları |

### Gamification Tabloları

| Tablo | Açıklama |
|-------|----------|
| `credit_transactions` | Kredi hareketleri |
| `credit_packages` | Satın alınabilir kredi paketleri |
| `badges` | Rozet tanımları |
| `user_badges` | Kullanıcı rozet kazanımları |
| `daily_missions` | Günlük görev tanımları |
| `user_missions` | Kullanıcı görev ilerlemeleri |
| `flash_deals` | Flaş fırsat kampanyaları |

### Sistem Tabloları

| Tablo | Açıklama |
|-------|----------|
| `error_logs` | Hata kayıtları |
| `analytics_events` | Kullanıcı analitik olayları |
| `alert_configurations` | Hata alarm yapılandırmaları |
| `cron_jobs` | Zamanlanmış görevler |
| `contact_messages` | İletişim formu mesajları |
| `analysis_prices` | Analiz fiyatlandırma tablosu |

---

## ⚡ Edge Functions (Backend)

| Fonksiyon | Açıklama |
|-----------|----------|
| `analyze-handwriting` | El yazısı görselinden AI analizi |
| `analyze-birth-chart` | Doğum haritası hesaplama ve yorumlama |
| `analyze-compatibility` | İki el yazısı karşılaştırma |
| `analyze-numerology` | İsim ve tarih tabanlı sayısal analiz |
| `analyze-palmistry` | Avuç içi fotoğrafından çizgi analizi |
| `analyze-tarot` | Tarot kartı yorumu |
| `analyze-coffee-fortune` | Kahve fincanı fotoğraflarından fal |
| `interpret-dream` | Rüya metni yorumu |
| `generate-daily-horoscope` | Günlük burç yorumu üretimi |
| `analyze-user-profile` | Kullanıcı profil analizi |
| `summarize-analyses` | Birden fazla analizi özetleme |
| `generate-friend-suggestions` | AI tabanlı arkadaş önerisi |
| `generate-og-image` | Dinamik Open Graph görseli |
| `send-call-notification` | Arama bildirimi gönderme |
| `send-analysis-notification` | Analiz tamamlanma bildirimi |
| `send-scheduled-messages` | Zamanlı mesaj gönderimi |
| `send-event-reminders` | Etkinlik hatırlatıcıları |
| `test-push-notification` | Push bildirim testi |
| `delete-user` | Kullanıcı hesap silme |

---

## 🎨 Tasarım Sistemi

### Tema

- **Birincil Renk:** Mor tonları (mistik/ruhsal estetik)
- **Karanlık/Aydınlık Mod:** next-themes ile tam destek
- **Gradient Kullanımı:** `bg-gradient-subtle`, `bg-gradient-primary`, `shadow-elegant`
- **Tipografi:** Inter font ailesi (400, 500, 600, 700)
- **İkon Seti:** Lucide React + Sparkles (marka ikonu)

### Responsive Tasarım

- **Mobile-first** yaklaşım
- **Bottom Navigation:** Mobil cihazlarda alt navigasyon çubuğu
- **Compact Header:** Mobil için optimize edilmiş başlık
- **PWA:** Tam ekran uygulama deneyimi

---

## 🔐 Güvenlik

- **Row Level Security (RLS):** Tüm tablolarda aktif
- **Email Doğrulama:** Kayıt sonrası email onayı zorunlu
- **Kullanıcı Engelleme:** `blocked_users` tablosu ile engelleme sistemi
- **Veri Şifreleme:** Supabase tarafından sağlanan at-rest şifreleme
- **CORS:** Edge function'larda CORS header kontrolü
- **Hesap Silme:** GDPR uyumlu tam hesap silme fonksiyonu

---

## 📊 Admin Paneli

- **Gerçek Zamanlı İstatistikler:** Kullanıcı, analiz, gelir metrikleri
- **Hata İzleme:** Error logs dashboard, severity seviyeleri
- **Sistem Sağlığı:** Cron job monitoring, başarı oranları
- **Kullanıcı Yönetimi:** Kredi ekleme, kullanıcı banlama
- **İçerik Moderasyonu:** Post/yorum yönetimi
- **Alarm Sistemi:** Hata eşik değerlerinde otomatik bildirim

---

## 📈 SEO & Performans

### SEO Optimizasyonları
- Dinamik `<title>` ve `<meta description>` (sayfa bazlı)
- Open Graph meta tagları (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card meta tagları
- Canonical URL: `https://analiz.sebanyazilim.com/`
- Semantic HTML (tek `<h1>`, `<nav>`, `<main>`, `<article>`)
- `robots.txt` ve sitemap desteği
- JSON-LD yapısal veri (uygulanabilir sayfalarda)

### Performans Optimizasyonları
- **Code Splitting:** React.lazy + Suspense ile sayfa bazlı lazy loading
- **Chunk Stratejisi:** React-bağımsız kütüphaneler ayrı chunk (supabase, recharts, date-fns, ephemeris, emoji-picker)
- **Veri Optimizasyonu:** Sorgu limitleri (5-10 kayıt başlangıç yüklemesi)
- **Görsel Optimizasyonu:** Lazy loading, WebP desteği, OptimizedImage bileşeni
- **CSS:** Tailwind PurgeCSS, CSS code splitting
- **Build Target:** ESNext (modern JS çıktısı)
- **Service Worker:** v2 — anında aktivasyon, eski önbellek temizleme
- **Font Loading:** `font-display: swap` stratejisi

### Erişilebilirlik
- `aria-label` tüm icon-only butonlarda
- `<nav aria-label>` navigasyon elementlerinde
- Semantic HTML yapısı
- Klavye navigasyonu desteği
- Alt text görsellerde

---

## 🔄 Gerçek Zamanlı Özellikler

Supabase Realtime kullanılarak şu tablolarda anlık güncellemeler sağlanır:
- `messages` — DM mesajları
- `group_messages` — Grup mesajları
- `call_signals` — WebRTC sinyal alışverişi
- `stories` — Yeni hikayeler
- `notifications` — Bildirimler

---

## 📦 Kurulum & Çalıştırma

```bash
# Depoyu klonla
git clone <REPO_URL>
cd <PROJE_KLASÖRÜ>

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview
```

### Ortam Değişkenleri (Otomatik)

`.env` dosyası Lovable Cloud tarafından otomatik yönetilir:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

---

## 📋 Kredi Sistemi

| İşlem | Kredi Maliyeti |
|-------|---------------|
| El Yazısı Analizi (konu başına) | 1 kredi |
| Numeroloji Analizi | 1 kredi |
| Doğum Haritası Analizi | 1 kredi |
| Tarot Falı | 1 kredi |
| Kahve Falı | 1 kredi |
| Rüya Yorumu | 1 kredi |
| El Falı | 1 kredi |
| Günlük Burç Yorumu | 1 kredi |
| Uyum Analizi | 50 kredi |
| Analiz Özetleme | Toplam kredinin 1/3'ü |
| Kayıt Bonusu | +10 kredi |

---

## 🎯 Hedef Kitle

- **Yaş Aralığı:** 18-35
- **İlgi Alanları:** Astroloji, spiritualite, dating, sosyal medya
- **Platform:** Öncelikli mobil kullanıcılar (PWA)
- **Pazar:** Türkiye (Türkçe arayüz)

---

## 🏆 Rekabetçi Farklılıklar

1. **Tek Platform, Üç Kategori:** Astroloji + Dating + Sosyal medya birleşimi
2. **AI Destekli Analizler:** 9 farklı analiz türü, API key gerektirmeyen AI entegrasyonu
3. **Astrolojik Eşleşme:** Doğum haritasına dayalı uyum skoru ile dating
4. **Gamification:** Rozetler, seviyeler, ligler, günlük görevler
5. **Kapsamlı Sosyal Özellikler:** Feed, hikayeler, reels, gruplar, mesajlaşma
6. **PWA:** Yüklenebilir, çevrimdışı çalışabilen uygulama

---

## 📝 Versiyon Notları

- **Mevcut Durum:** Tüm 6 geliştirme fazı tamamlandı
- **Toplam Bileşen:** 120+ React bileşeni
- **Toplam Sayfa:** 25+ route
- **Toplam Hook:** 30+ custom hook
- **Toplam Edge Function:** 15+ backend fonksiyonu
- **Toplam Veritabanı Tablosu:** 50+ tablo

---

*Bu dokümantasyon Astro Social projesinin kapsamlı bir özetidir. Proje aktif geliştirme altındadır.*
