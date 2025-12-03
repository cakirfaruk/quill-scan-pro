-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price_try, description, is_active) VALUES
('Başlangıç', 50, 29.99, '50 kredi - Yeni başlayanlar için ideal', true),
('Popüler', 150, 79.99, '150 kredi + %10 bonus değer', true),
('Premium', 500, 199.99, '500 kredi + %25 bonus değer', true),
('Ultimate', 1000, 349.99, '1000 kredi + %40 bonus değer', true)
ON CONFLICT DO NOTHING;

-- Insert default daily missions
INSERT INTO public.daily_missions (title, description, action_type, target_count, xp_reward, credit_reward, icon, category, is_active, sort_order) VALUES
('Günlük Giriş', 'Uygulamaya giriş yap', 'login', 1, 10, 1, 'LogIn', 'daily', true, 1),
('Gönderi Paylaş', 'Bir gönderi paylaş', 'create_post', 1, 20, 2, 'PenSquare', 'social', true, 2),
('Yorum Yap', '3 gönderiye yorum yap', 'comment', 3, 15, 1, 'MessageSquare', 'social', true, 3),
('Beğeni Gönder', '5 gönderi beğen', 'like', 5, 10, 0, 'Heart', 'social', true, 4),
('Arkadaş Ekle', 'Bir arkadaşlık isteği gönder', 'friend_request', 1, 25, 3, 'UserPlus', 'social', true, 5),
('Analiz Yap', 'Herhangi bir analiz tamamla', 'analysis', 1, 50, 5, 'Sparkles', 'analysis', true, 6),
('Mesaj Gönder', 'Bir arkadaşına mesaj gönder', 'send_message', 1, 15, 1, 'Send', 'social', true, 7),
('Hikaye Paylaş', 'Bir hikaye paylaş', 'create_story', 1, 30, 2, 'Camera', 'social', true, 8)
ON CONFLICT DO NOTHING;