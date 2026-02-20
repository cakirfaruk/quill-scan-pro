
# Lighthouse 100/100 Optimizasyon Planı

## Mevcut Durum (Lighthouse Raporu Analizi)

### Puanlar
| Sayfa | Performans | Erişilebilirlik | SEO |
|-------|-----------|----------------|-----|
| Ana Sayfa | **25** | ? | ? |
| Profil | **25** | **82** | **100/92** |

### Tespit Edilen Kritik Sorunlar

**PERFORMANS (En Büyük Sorun — Skor: 25)**

1. **Dev Mode ile test edilmiş**: Lighthouse raporları `localhost:8080` üzerinden `dev mode`'da alınmış. Bu çok kritik: Dev modunda `framer-motion.js` (381 KiB), `react-dom.development.js` (887 KiB), `lucide-react.js` (1.132 KiB) gibi devasa debug versiyonları yükleniyor. Production build'de bunlar küçülür.

2. **LCP: 157 saniye (Ana Sayfa), 105 saniye (Profil)** — `loadAnalyses()` fonksiyonu profil sayfasında 9 ayrı veritabanı sorgusu yapıyor, bunlar tamamlanmadan sayfa render edilmiyor.

3. **Total Blocking Time: 6.260 ms (Ana Sayfa), 47.370 ms (Profil)** — Profil sayfası muazzam miktarda blokaj yapıyor. 

4. **Veri boyutu: 64 MB (Ana Sayfa), 88 MB (Profil)** — Posts tablosundan gereksiz veri çekiliyor (palmistry_readings: 11 MB, friends: 10 MB tekrarlı sorgu).

5. **Kullanılmayan JS: 1.688 KiB** — `framer-motion` (188 KiB tasarruf mümkün), `emoji-picker-react` (104 KiB), `zod` (99 KiB) — bunlar ana sayfada kullanılmıyor ama yükleniyor.

6. **Kullanılmayan CSS: ~30 KiB** — Tailwind'in tüm utility classları yükleniyor.

**SEO (Kritik Eksikler)**

- `og:url` canonical URL eksik (sadece `og:type` var, `og:url` yok)
- Twitter `@lovable_dev` sitesi olan ama uygulamaya ait olmayan bilgiler
- Profil, Match, Discovery, Feed sayfalarında per-page `<title>` ve `<meta description>` yok (SPA olduğu için her route için dinamik meta tag güncellenmeli)

**ERİŞİLEBİLİRLİK (Profil: 82/100)**

- `<nav>` elemanında `aria-label` eksik (bottom navigation)  
- Icon-only butonlarda `aria-label` eksik (MessageCircle, Coins butonu)
- Avatar görsellerinde alt text yetersiz

---

## Düzeltme Planı

### FIX 1 — `index.html`: SEO ve Meta Tag İyileştirmeleri

**Sorunlar:**
- `og:url` meta tag eksik
- `twitter:site` yanlış (`@lovable_dev`)
- `rel="canonical"` eksik (memory'de canonical domain kayıtlı: `https://analiz.sebanyazilim.com/`)
- `viewport-fit=cover` var ama `user-scalable` kontrolü eksik
- Font preload `onload` handler ile yükleniyor — bu `as="style"` ile çakışıyor ve Lighthouse uyarı veriyor

**Yapılacak:**
```html
<!-- Eklenecek -->
<link rel="canonical" href="https://analiz.sebanyazilim.com/" />
<meta property="og:url" content="https://analiz.sebanyazilim.com/" />
<!-- Düzeltilecek -->
<meta name="twitter:site" content="@astrosocial" />
<!-- Font preload düzeltilecek: onload handler kaldırılacak, doğrudan stylesheet -->
```

---

### FIX 2 — `src/utils/meta.ts` (yeni dosya): Dinamik Per-Page SEO

Her route için `<title>` ve `<meta description>` güncellenmeli. Basit bir `updatePageMeta()` utility fonksiyonu oluşturulacak:

```typescript
export const updatePageMeta = (title: string, description?: string) => {
  document.title = `${title} | Astro Social`;
  // meta description güncelle
};
```

Bu utility şu sayfalarda çağrılacak:
- `Discovery.tsx` → "Insight Command Center | Astro Social"
- `Match.tsx` → "Eşleşme | Astro Social"  
- `Feed.tsx` → "Feed | Astro Social"
- `Profile.tsx` → dinamik `"{username} Profili | Astro Social"`

---

### FIX 3 — `src/components/layout/MainLayout.tsx`: Erişilebilirlik

Bottom nav `<nav>` elementine `aria-label` eklenmeli:

```html
<nav aria-label="Ana navigasyon">
```

---

### FIX 4 — `src/components/CompactHeader.tsx`: Erişilebilirlik

Icon-only butonlara `aria-label` eklenmeli:

```tsx
// MessageCircle butonu
<Button aria-label="Mesajlar">
  <MessageCircle />
</Button>

// Coins butonu  
<Button aria-label="Kredi bakiyesi">
  <Coins />
</Button>
```

---

### FIX 5 — `src/pages/Profile.tsx`: Veri Boyutu Azaltma (en büyük LCP kazanımı)

**Sorun:** `loadAnalyses()` 9 paralel sorgu yapıyor, profil yüklenene kadar sayfa bloke oluyor. `palmistry_readings` tek başına 11 MB veri dönüyor.

**Çözüm:**
1. Analizleri asenkron yükle — profil render olduktan SONRA yükle (zaten böyle ama daha dikkatli yapılmalı)
2. Her analiz tablosunda `limit(5)` kullan başlangıçta (şu an `limit(20)`)
3. Friends sorgusunda `select` daha kısıtlı: sadece gerekli alanları seç

```typescript
// ÖNCE (profil sayfasında):
supabase.from("palmistry_readings").select("id, created_at, credits_used").eq("user_id", userId).limit(20)

// SONRA:
supabase.from("palmistry_readings").select("id, created_at, credits_used").eq("user_id", userId).limit(5)
```

---

### FIX 6 — `src/hooks/use-feed-posts.ts`: Posts Sorgu Optimizasyonu

**Sorun:** Feed sayfasından posts sorgusu + friends sorgusu iki kez yapılıyor (64 MB veri dönüyor).

**Çözüm:**
- `POSTS_PER_PAGE` değerini 20'den **10'a** düşür (başlangıçta daha az veri)
- `friends` listesi profil context'ten alınsın, tekrar sorgu yapılmasın

---

### FIX 7 — `vite.config.ts`: Production Build Optimizasyonları

**Sorun:** Lighthouse testleri dev modda yapılmış. Ancak üretim build'i için de iyileştirmeler gerekiyor:

- `build.target: 'esnext'` ekle (modern JS, daha küçük çıktı)
- `build.cssCodeSplit: true` ekle (sayfa başına sadece gerekli CSS)
- Tailwind PurgeCSS ayarlarını kontrol et

---

### FIX 8 — `src/components/LandingPage.tsx`: LCP Optimizasyonu

**Sorun:** LandingPage'deki hero section büyük gradyan animasyonları var (parallax, pulse, blur). Bunlar paint'i geciktiriyor.

**Çözüm:**
- `animate-pulse` sınıfı hero background div'lerinden kaldırılacak
- Parallax efekti IntersectionObserver ile ertelenecek: sayfa görünürleşene kadar çalışmayacak

---

### FIX 9 — `index.html`: Font Yükleme Stratejisi

**Mevcut (hatalı):**
```html
<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**Sorun:** `onload` handler Lighthouse'da "ineffective use of rel=preload" uyarısı veriyor. Bunun yerine:

```html
<!-- Direkt stylesheet, font-display:swap yeterli -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
```

**Dosyalar Etkilenecek:**
- `index.html` (SEO meta tags + font yükleme + canonical)
- `src/utils/meta.ts` (yeni dosya — dinamik per-page title/description)
- `src/pages/Discovery.tsx` (meta güncelleme çağrısı)
- `src/pages/Match.tsx` (meta güncelleme çağrısı)
- `src/pages/Feed.tsx` (meta güncelleme çağrısı)
- `src/pages/Profile.tsx` (dinamik meta + limit azaltma)
- `src/hooks/use-feed-posts.ts` (POSTS_PER_PAGE 20→10)
- `src/components/layout/MainLayout.tsx` (aria-label nav)
- `src/components/CompactHeader.tsx` (aria-label butonlar)
- `src/components/LandingPage.tsx` (animate-pulse kaldır)
- `vite.config.ts` (build.target, cssCodeSplit)

---

## Neden Performans Skoru Dev Modda 25?

**Önemli not:** Bu testlerin dev modda çalıştırıldığını belirtmem gerekiyor. Dev modda:
- `react-dom.development.js`: 887 KiB (production: ~130 KiB)
- `framer-motion.js`: 381 KiB development build
- `lucide-react.js`: 1.132 KiB (tüm ikonlar dahil, tree-shake yok)

Production build'de JS boyutu yaklaşık 3-5x küçülür. Lighthouse testlerini production build (`npm run build && npm run preview`) üzerinden çalıştırmak çok daha gerçekçi sonuç verir. Bununla birlikte, yukarıdaki tüm fixler hem dev hem production için geçerlidir.

**Beklenen iyileşmeler (production build üzerinde):**
- Performans: 25 → 65-75 (veri boyutu azaltma ve JS optimizasyonu ile)
- Erişilebilirlik: 82 → 95+
- SEO: 92 → 98-100
- Best Practices: 90 → 95+
