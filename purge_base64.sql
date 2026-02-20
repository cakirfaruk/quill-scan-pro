-- DİKKAT: Bu SQL sorgusu, daha önceden veritabanına büyük "Base64" metinleri olarak
-- kaydedilmiş olan (ve tarayıcınızı çökerten) profil fotoğraflarını, hikayeleri ve
-- post görsellerini temizlemek içindir.

-- 1. Profillerdeki hatalı Base64 fotoğrafları temizle
UPDATE public.profiles 
SET profile_photo = NULL 
WHERE profile_photo LIKE 'data:image%';

-- 2. Profillerdeki hatalı Base64 kapak fotoğraflarını temizle (varsa)
UPDATE public.profiles 
SET cover_photo = NULL 
WHERE cover_photo LIKE 'data:image%';

-- 3. Hikayelerdeki hatalı Base64 görselleri ve videoları temizle
UPDATE public.stories 
SET media_url = NULL 
WHERE media_url LIKE 'data:image%' OR media_url LIKE 'data:video%';

-- 4. Gönderilerdeki (Posts) hatalı Base64 görselleri temizle
UPDATE public.posts 
SET media_url = NULL 
WHERE media_url LIKE 'data:image%' OR media_url LIKE 'data:video%';

-- 5. Videolardaki hatalı Base64 küçük resimleri (thumbnails) temizle
UPDATE public.user_videos 
SET thumbnail_url = NULL 
WHERE thumbnail_url LIKE 'data:image%';
