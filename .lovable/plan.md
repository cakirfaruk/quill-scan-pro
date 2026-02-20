
## Kök Neden Analizi

### Sorun 1: React Duplication (useContext / useRef null hatası)

`vite.config.ts` içindeki `manualChunks` konfigürasyonu kritik bir hata barındırıyor:

```
react-router-dom  →  'react-router' chunk
@radix-ui         →  'radix-vendor' chunk
react-hook-form   →  'form-vendor' chunk
lucide-react      →  'lucide-icons' chunk
```

Bu kütüphanelerin hepsi React'ı bir **peer dependency** olarak kullanır. Rollup bunları farklı chunk'lara böldüğünde, her chunk kendi React referansını çözümlemeye çalışır. Eğer React `react-core` chunk'ına yüklenmeden önce bu chunk'lardan biri çalışırsa, `React` nesnesi `null` olur ve `useContext`, `useRef`, `forwardRef` gibi hook'lar çöker.

`resolve.dedupe` ve `optimizeDeps.dedupe` sadece module resolution düzeyinde çalışır; Rollup'ın chunk output'unu etkilemez.

### Sorun 2: Stale Chunk 404 (Loading loop)

Her yeni deploy sonrası eski chunk hash'leri (örn. `CreatePostDialog-6AhfR_Qw.js`) geçersiz hale gelir. Browser önbellekte eski HTML'i tutar, HTML yeni hash'li chunk URL'lerini referans eder, eski hash'ler silindiği için 404 alınır. Bu durum uygulamanın tamamen yüklenememesiyle sonuçlanır.

### Çözüm Planı

**1. `vite.config.ts` — manualChunks tamamen yeniden yazılacak**

React'a bağımlı HER kütüphaneyi ayrı chunk'a BÖLME. Sadece React'tan bağımsız, tamamen standalone kütüphaneler (supabase, recharts, date-fns) ayrı chunk olabilir:

```
ÖNCE (HATALI):
react-router    → 'react-router'    ← React context'i ayrı chunk'ta kayboluyor
@radix-ui       → 'radix-vendor'    ← forwardRef null hatası
react-hook-form → 'form-vendor'     ← ayrı React instance

SONRA (DOĞRU):
react           → undefined  (Vite kendi yönetir)
react-router    → undefined  (Vite kendi yönetir, React ile aynı scope)
@radix-ui       → undefined  (Vite kendi yönetir)
react-hook-form → undefined  (Vite kendi yönetir)
@supabase       → 'supabase-vendor'  (React bağımsız)
recharts        → 'charts-vendor'    (React bağımsız)
date-fns        → 'date-vendor'      (React bağımsız)
ephemeris       → 'astro-vendor'     (React bağımsız)
emoji-picker    → 'emoji-vendor'     (React bağımsız, büyük boyut)
```

**2. `modulePreload: false` kaldırılacak**

`modulePreload: false` aslında stale chunk sorununu KÖTÜLEŞTIRIR. Browser'ın doğal modulepreload mekanizması, chunk'ların doğru sırada yüklenmesini sağlar. Bu ayar kaldırılmalı veya varsayılan değerine döndürülmeli.

**3. `App.tsx` — ChunkErrorBoundary entegrasyonu**

`<Suspense>` bloğu `ChunkErrorBoundary` ile sarılacak, böylece 404 chunk hatalarında kullanıcıya "Güncelleme algılandı, yenile" butonu gösterilecek.

**4. `src/main.tsx` — Service Worker güncelleme zorlaması**

PWA service worker'ın eski chunk'ları önbellekte tutması da loading loop'a sebep olabilir. Service worker yeni sürüm algıladığında hemen `skipWaiting()` ve `clients.claim()` yapacak şekilde ayarlanacak.

### Teknik Detaylar

**Etkilenecek Dosyalar:**
- `vite.config.ts` — manualChunks stratejisi (ANA FİX)
- `src/App.tsx` — ChunkErrorBoundary entegrasyonu
- `public/sw.js` — Service worker güncelleme stratejisi

**Tahmini Sonuç:**
- `useContext / useRef null` hataları tamamen ortadan kalkar
- Stale chunk 404'leri kullanıcıya anlaşılır bir hata gösterir
- PWA güncelleme döngüsü düzgün çalışır
