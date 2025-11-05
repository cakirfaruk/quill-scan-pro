# Performance Optimization Guide

Tüm performans optimizasyonlarının detaylı kullanım kılavuzu.

## 📊 Bundle Analysis

### Kullanım
```bash
npm run build
```

Build tamamlandıktan sonra `dist/stats.html` dosyası oluşur. Bu dosyayı tarayıcıda açarak:
- En büyük bundle'ları görebilirsiniz
- Gereksiz kütüphaneleri tespit edebilirsiniz
- Chunk'ların boyutlarını analiz edebilirsiniz

### Bundle Boyutu Hedefleri
- ✅ İlk chunk (initial): < 200 KB (gzipped)
- ✅ Vendor chunks: < 150 KB (gzipped)
- ✅ Route chunks: < 50 KB (gzipped)

---

## 🖼️ Image Optimization

### OptimizedImage Komponenti
```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={800}
  priority={true} // İlk ekran görselleri için
/>
```

### Özellikler
- ✅ Otomatik WebP formatı
- ✅ Lazy loading (viewport'a girince yükle)
- ✅ Progressive loading (önce düşük kalite)
- ✅ Otomatik responsive images

---

## 📜 Virtual Scrolling

Uzun listeler için (feed, messages, vb.)

```tsx
import { VirtualScrollFeed } from '@/components/VirtualScrollFeed';

<VirtualScrollFeed
  items={posts}
  renderItem={(post) => <PostCard post={post} />}
  itemHeight={400}
  overscan={3}
  onLoadMore={loadMorePosts}
  hasMore={hasMore}
/>
```

**Performans Kazancı:** 1000 item için ~10x daha hızlı render

---

## 🧩 Code Splitting

### Automatic Route-based Splitting
Tüm sayfalar otomatik olarak ayrı chunk'lara bölünür:

```tsx
// App.tsx - Otomatik lazy loading
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));
```

### Manual Code Splitting
Ağır komponentler için:

```tsx
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### Dynamic Import Hook
İhtiyaç olduğunda library yükle:

```tsx
import { useDynamicImport } from '@/hooks/use-dynamic-import';

function ChartView() {
  const { module: ChartLib, loading } = useDynamicImport(
    () => import('heavy-chart-library'),
    showChart // sadece chart gösterilecekse yükle
  );

  if (loading) return <Skeleton />;
  return <ChartLib.Chart data={data} />;
}
```

---

## ⚡ React Performance

### Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

// Component memoization
const PostCard = memo(({ post, onLike }) => {
  // Component only re-renders if post or onLike changes
  return <div>{post.content}</div>;
});

// Value memoization
const ExpensiveComponent = () => {
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]); // Only recompute if data changes

  // Function memoization
  const handleClick = useCallback(() => {
    doSomething(id);
  }, [id]); // Only recreate if id changes

  return <div onClick={handleClick}>{expensiveValue}</div>;
};
```

### Debouncing & Throttling
```tsx
import { useDebounce } from '@/hooks/use-debounce';
import { useThrottle } from '@/hooks/use-throttle';

// Search input - 500ms delay
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  searchAPI(debouncedSearch);
}, [debouncedSearch]);

// Scroll event - max 1 call per 200ms
const handleScroll = useThrottledCallback((e) => {
  checkScrollPosition(e);
}, 200);
```

---

## 🗄️ Database Optimization

### Indexler
Şu tablolarda indexler eklenmiş:
- `posts`: user_id, created_at, post_type
- `messages`: sender_id, receiver_id, created_at
- `friends`: user_id, friend_id, status
- `notifications`: user_id, read, created_at
- `profiles`: username, is_online
- `post_likes`: post_id, user_id

### N+1 Query Önleme

**❌ YANLIŞ (N+1 Problem)**
```tsx
// Her post için ayrı query - 100 post için 101 query!
const posts = await fetchPosts();
for (const post of posts) {
  post.profile = await fetchProfile(post.user_id); // ❌ N+1
  post.likes = await fetchLikes(post.id); // ❌ N+1
}
```

**✅ DOĞRU (Batch Fetching)**
```tsx
import { fetchOptimizedFeed } from '@/utils/queryOptimization';

// Tüm data 3 query'de gelir
const posts = await fetchOptimizedFeed(userId, 20);
// - 1 query: posts + profiles (JOIN)
// - 1 query: tüm likes (IN clause)
// - 1 query: tüm comments (IN clause)
```

### Batch Utilities
```tsx
import { 
  batchFetchProfiles, 
  batchFetchPostLikes 
} from '@/utils/queryOptimization';

// Birden fazla profil tek sorguda
const profiles = await batchFetchProfiles([id1, id2, id3]);

// Birden fazla post'un like'ları tek sorguda
const { likesMap, userLikesMap } = await batchFetchPostLikes(
  postIds, 
  currentUserId
);
```

---

## 💾 Caching Strategy

### React Query Cache
```tsx
import { useCacheQuery } from '@/hooks/use-cache-query';

// 10 dakika cache + background refetch
const { data } = useCacheQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  cacheDuration: 10,
  backgroundRefetch: true
});

// İlişkili query'leri önceden yükle
const { data: posts } = useCacheQuery({
  queryKey: ['posts', userId],
  queryFn: () => fetchPosts(userId),
  cacheDuration: 5,
  prefetchQueries: [
    { 
      queryKey: ['user', userId], 
      queryFn: () => fetchUser(userId) 
    }
  ]
});
```

### In-Memory Cache
```tsx
import { profilesCache } from '@/utils/queryOptimization';

// Cache'e kaydet (10 dakika TTL)
profilesCache.set('user-123', profileData);

// Cache'den oku
const cached = profilesCache.get('user-123');
if (cached) {
  return cached; // Database'e gitme
}
```

### Browser Cache (Service Worker)
Otomatik olarak şu kaynakları cache'ler:
- ✅ Supabase API: 5 dakika (NetworkFirst)
- ✅ Supabase Storage: 30 gün (CacheFirst)
- ✅ Images: 30 gün (CacheFirst)
- ✅ Google Fonts: 1 yıl (CacheFirst)

### Edge Function Cache
```typescript
// supabase/functions/your-function/index.ts
import { getFromCache, setInCache } from './edgeFunctionCache';

Deno.serve(async (req) => {
  const cacheKey = 'expensive-data-123';
  
  // Cache'den dene
  let data = getFromCache(cacheKey);
  
  if (!data) {
    // Database'den çek
    data = await expensiveQuery();
    
    // 5 dakika cache'le
    setInCache(cacheKey, data, { ttl: 300 });
  }
  
  return new Response(JSON.stringify(data), {
    headers: { 
      'Cache-Control': 'public, max-age=300' 
    }
  });
});
```

---

## 🎯 Cache Invalidation

### React Query
```tsx
import { useQueryClient } from '@tanstack/react-query';
import { cacheUtils } from '@/hooks/use-cache-query';

const queryClient = useQueryClient();

// Tek query invalidate
queryClient.invalidateQueries({ queryKey: ['posts'] });

// Pattern'e uyan tüm query'ler
cacheUtils.invalidatePattern(queryClient, 'user-');

// Optimistic update
cacheUtils.setQueryData(queryClient, ['post', postId], newData);
```

### In-Memory Cache
```tsx
import { profilesCache } from '@/utils/queryOptimization';

// Tek entry
profilesCache.clear();

// Tüm cache
profilesCache.clear();
```

---

## 📈 Performance Monitoring

### Bundle Analysis
```bash
npm run build
# dist/stats.html dosyasını aç
```

### React DevTools Profiler
1. React DevTools extension yükle
2. Profiler sekmesini aç
3. Record butonuna bas
4. Uygulamayı kullan
5. Stop butonuna bas
6. Yavaş component'leri görüntüle

### Lighthouse
```bash
# Chrome DevTools > Lighthouse
# "Performance" seçeneğini seç
# "Analyze page load" çalıştır
```

**Hedefler:**
- ✅ Performance Score: > 90
- ✅ First Contentful Paint: < 1.8s
- ✅ Time to Interactive: < 3.9s
- ✅ Total Blocking Time: < 300ms

---

## 🚀 Best Practices Checklist

### Frontend
- [x] Virtual scrolling uzun listeler için
- [x] Image optimization (WebP, lazy load)
- [x] Route-based code splitting
- [x] Component memoization (React.memo)
- [x] Value memoization (useMemo)
- [x] Callback memoization (useCallback)
- [x] Debouncing (search, input)
- [x] Throttling (scroll, resize)
- [x] Bundle analysis

### Backend
- [x] Database indexing
- [x] N+1 query önleme (batch fetching)
- [x] React Query cache stratejisi
- [x] Browser cache (Service Worker)
- [x] In-memory cache
- [x] Edge function cache

### Monitoring
- [ ] Bundle size tracking
- [ ] Performance metrics (Web Vitals)
- [ ] Error tracking
- [ ] Cache hit rates

---

## 📚 Ek Kaynaklar

- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Query Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
