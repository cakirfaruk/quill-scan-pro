-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create post_hashtags junction table
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Create post_mentions table
CREATE TABLE IF NOT EXISTS public.post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, mentioned_user_id)
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for hashtags
CREATE POLICY "Anyone can view hashtags"
ON public.hashtags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can manage hashtags"
ON public.hashtags
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS policies for post_hashtags
CREATE POLICY "Anyone can view post hashtags"
ON public.post_hashtags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add hashtags to their posts"
ON public.post_hashtags
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_hashtags.post_id
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete hashtags from their posts"
ON public.post_hashtags
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_hashtags.post_id
    AND posts.user_id = auth.uid()
  )
);

-- RLS policies for post_mentions
CREATE POLICY "Anyone can view mentions"
ON public.post_mentions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can mention others in their posts"
ON public.post_mentions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_mentions.post_id
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete mentions from their posts"
ON public.post_mentions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_mentions.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON public.hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON public.post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON public.post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_user_id ON public.post_mentions(mentioned_user_id);

-- Function to increment hashtag usage
CREATE OR REPLACE FUNCTION public.increment_hashtag_usage(tag_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashtag_id UUID;
BEGIN
  -- Insert or update hashtag
  INSERT INTO public.hashtags (tag, usage_count, updated_at)
  VALUES (LOWER(tag_text), 1, now())
  ON CONFLICT (tag) 
  DO UPDATE SET 
    usage_count = hashtags.usage_count + 1,
    updated_at = now()
  RETURNING id INTO hashtag_id;
  
  RETURN hashtag_id;
END;
$$;

-- Trigger to notify mentioned users
CREATE OR REPLACE FUNCTION public.notify_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author TEXT;
  v_post_content TEXT;
BEGIN
  -- Get post author and content
  SELECT p.user_id, pr.username, po.content
  INTO NEW.post_id, v_post_author, v_post_content
  FROM posts po
  JOIN profiles pr ON pr.user_id = po.user_id
  WHERE po.id = NEW.post_id;
  
  -- Create notification for mentioned user
  PERFORM public.create_notification(
    NEW.mentioned_user_id,
    'mention',
    'Bir Gönderide Etiketlendiniz',
    v_post_author || ' sizi bir gönderide etiketledi',
    '/feed',
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_mention
AFTER INSERT ON public.post_mentions
FOR EACH ROW
EXECUTE FUNCTION public.notify_mention();

-- Update hashtags updated_at trigger
CREATE TRIGGER update_hashtags_updated_at
BEFORE UPDATE ON public.hashtags
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();