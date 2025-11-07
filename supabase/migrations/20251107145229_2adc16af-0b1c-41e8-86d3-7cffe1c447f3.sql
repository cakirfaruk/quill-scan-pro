-- Tüm gönderilerin herkese açık görünmesi için RLS politikası ekle
CREATE POLICY "All users can view all public posts"
ON public.posts
FOR SELECT
USING (true);

-- Tüm kullanıcılar post_likes tablosunu görebilir
DROP POLICY IF EXISTS "Users can view post likes" ON public.post_likes;
CREATE POLICY "Users can view post likes"
ON public.post_likes
FOR SELECT
USING (true);

-- Tüm kullanıcılar post_comments tablosunu görebilir
DROP POLICY IF EXISTS "Users can view post comments" ON public.post_comments;
CREATE POLICY "Users can view post comments"
ON public.post_comments
FOR SELECT
USING (true);