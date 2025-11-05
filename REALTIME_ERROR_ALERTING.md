# Real-time Error Alerting Sistemi

Bu doküman real-time error alerting sisteminin kurulumunu ve kullanımını açıklar.

## 🔴 Özellikler

### 1. Real-time Error Tracking
- **WebSocket Bağlantısı:** Supabase Realtime ile `error_logs` tablosunu dinler
- **Anında Bildirim:** Yeni hatalar oluştuğunda gerçek zamanlı toast notification
- **Severity Filtering:** Kullanıcı hangi seviyedeki hataları görmek istediğini seçebilir
- **Browser Push:** Sekme kapalıyken bile bildirim (kullanıcı izni gerekiyor)

### 2. Bildirim Tercihleri
- **Enable/Disable:** Tüm bildirimleri aç/kapa
- **Severity Threshold:** Minimum hata seviyesi seçimi
  - `info`: Tüm bildirimler
  - `warning`: Uyarılar ve üstü
  - `error`: Sadece hatalar (varsayılan)
  - `fatal`: Sadece kritik hatalar
- **Push Notifications:** Browser push bildirimleri

### 3. Database Yapısı

**notification_preferences** tablosu:
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id),
  error_alerts_enabled BOOLEAN DEFAULT true,
  alert_severity_threshold TEXT DEFAULT 'error',
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,
  email_alerts_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**error_logs** tablosu (Realtime enabled):
- `ALTER PUBLICATION supabase_realtime ADD TABLE error_logs;`

---

## 📱 Kullanım

### Frontend - Ayarlar Sayfası

1. **Settings sayfasına git** (`/settings`)
2. **Notifications** sekmesini aç
3. **"Hata Bildirimleri"** kartında:
   - Bildirimleri aç/kapa
   - Minimum hata seviyesini seç
   - Push bildirimleri etkinleştir

### Frontend - Header Indicator

Header'da bell icon yanında **error alert indicator** gösterilir:
- **Yeşil nokta:** Bildirimler aktif + push enabled
- **Normal bell:** Bildirimler aktif
- **BellOff:** Bildirimler kapalı

Dropdown menüden:
- Mevcut ayarları görüntüle
- Hızlıca aç/kapa

---

## 🔧 Teknik Detaylar

### 1. Hook: `useErrorAlerts`

**Konum:** `src/hooks/use-error-alerts.ts`

**Özellikler:**
```typescript
const {
  preferences,           // Kullanıcı tercihleri
  isLoading,            // Yükleniyor mu?
  updatePreferences,    // Tercihleri güncelle
  requestPushPermission // Push izni iste
} = useErrorAlerts();
```

**Realtime Subscription:**
```typescript
supabase
  .channel('error-alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'error_logs',
  }, (payload) => {
    // Yeni hata geldi, toast göster
  })
  .subscribe();
```

### 2. Component: `ErrorAlertSettings`

**Konum:** `src/components/ErrorAlertSettings.tsx`

Settings sayfasında gösterilen kart component:
- Bildirim durumu
- Enable/disable toggle
- Severity threshold selector
- Push notification toggle
- Kullanım talimatları

### 3. Component: `ErrorAlertIndicator`

**Konum:** `src/components/ErrorAlertIndicator.tsx`

Header'da gösterilen mini indicator:
- Icon gösterimi (bell/bellOff)
- Aktif olduğunda yeşil animasyonlu nokta
- Dropdown menü ile quick actions

---

## 🔔 Bildirim Davranışı

### Toast Notifications

**Severity'ye göre görünüm:**
- `info`: ℹ️ Bilgi (mavi, 5 saniye)
- `warning`: ⚠️ Uyarı (sarı, 5 saniye)
- `error`: 🔴 Hata (kırmızı, 5 saniye)
- `fatal`: 💀 Kritik Hata (mor, manuel kapatma gerekiyor)

**İçerik:**
```
[Emoji] [Seviye]
[Error Type]
[Error Message]
```

### Browser Push Notifications

**Gereksinimler:**
- HTTPS (production)
- Kullanıcı izni (`Notification.requestPermission()`)
- `push_enabled: true` ayarı

**Davranış:**
- Sekme kapalıyken çalışır
- Tıklanınca uygulamayı açar
- `fatal` errors için `requireInteraction: true`

---

## 🎯 Severity Threshold Mantığı

```typescript
const SEVERITY_LEVELS = {
  info: 1,
  warning: 2,
  error: 3,
  fatal: 4,
};

// Threshold 'error' (3) ise:
// - info (1): Gösterilmez ❌
// - warning (2): Gösterilmez ❌
// - error (3): Gösterilir ✅
// - fatal (4): Gösterilir ✅
```

---

## 🚀 Kurulum

Sistem otomatik olarak kurulur:

1. **Database Migration:** ✅ Tamamlandı
   - `notification_preferences` tablosu oluşturuldu
   - `error_logs` realtime enabled
   - RLS policies eklendi

2. **Frontend Integration:** ✅ Tamamlandı
   - Hook eklendi (`useErrorAlerts`)
   - Components eklendi (Settings, Indicator)
   - App.tsx'te hook aktif edildi
   - Header'a indicator eklendi

3. **İlk Kullanım:**
   - Kullanıcı ilk kez sisteme girdiğinde otomatik varsayılan preferences oluşturulur
   - Varsayılan ayarlar:
     - `error_alerts_enabled: true`
     - `alert_severity_threshold: 'error'`
     - `push_enabled: false`

---

## 🔐 Güvenlik

### RLS Policies

**notification_preferences:**
- ✅ Users can view their own preferences
- ✅ Users can update their own preferences
- ✅ Users can insert their own preferences

**error_logs:**
- ✅ Anyone can insert (hata tracking için gerekli)
- ✅ Users can view their own errors
- ✅ Admins can view all errors
- ✅ Admins can update errors (resolved status)

### Push Subscription

Push subscription data `JSONB` olarak saklanır:
```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

---

## 📊 Performans

### Optimizasyonlar

1. **Conditional Subscription:**
   - Sadece `error_alerts_enabled: true` ise realtime subscribe
   - İzinsiz kullanıcılar için overhead yok

2. **Client-side Filtering:**
   - Severity threshold client-side kontrol edilir
   - Gereksiz toast'lar gösterilmez

3. **Single Channel:**
   - Tüm error alerts tek channel'da
   - Multi-channel overhead'i yok

### Resource Usage

- **Memory:** ~2KB per active subscription
- **Network:** WebSocket bağlantısı (keep-alive)
- **Database:** 1 query per user (preferences fetch)

---

## 🐛 Debug

### Logs

Hook ve component'ler console.log kullanır:

```javascript
// Preferences fetch
console.log('Fetching preferences...');

// Realtime event
console.log('New error received:', error);

// Push permission
console.log('Push permission:', permission);
```

### Test

Manual test için:

```javascript
// Error tracking utility kullan
import { captureError } from '@/utils/errorTracking';

// Test error
captureError(new Error('Test error'), {
  severity: 'error',
  context: { test: true }
});
```

---

## 🔮 Gelecek İyileştirmeler

### Potansiyel Eklemeler

1. **Email Alerts:**
   - Critical errors için email bildirimi
   - Daily/weekly summary

2. **Slack/Discord Integration:**
   - Team notification için webhook
   - Error grouping

3. **Alert Rules:**
   - Frequency-based (N errors in X minutes)
   - Pattern matching (specific error types)
   - User-specific rules

4. **Snooze:**
   - Geçici olarak belirli error type'ları sustur
   - Time-based snooze (1 hour, 1 day, etc.)

5. **Analytics:**
   - Alert statistics
   - Response time
   - Dismiss rate

---

## 📝 Notlar

1. **Browser Compatibility:**
   - Push notifications: Chrome, Firefox, Edge (modern versions)
   - Safari: Limited support (macOS Big Sur+)

2. **VAPID Keys:**
   - Zaten kurulu (secrets'ta mevcut)
   - Production'da geçerli

3. **Throttling:**
   - Şu anda throttling yok
   - Spam protection için ileride eklenebilir

4. **Offline Behavior:**
   - Realtime subscription offline'da durur
   - Online olunca otomatik reconnect
   - Missed errors: Next refresh'te görünür

---

## 🎓 Öğrenme Kaynakları

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Web Push Notifications](https://web.dev/notifications/)
- [React Hooks Best Practices](https://react.dev/reference/react)
