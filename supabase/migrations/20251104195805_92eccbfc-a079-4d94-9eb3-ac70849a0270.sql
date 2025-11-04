-- Update call_logs table to support video calls
ALTER TABLE public.call_logs
ADD COLUMN IF NOT EXISTS has_video BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_screen_share BOOLEAN DEFAULT false;

-- Create table for WebRTC signaling
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.call_logs(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Users can send signals
CREATE POLICY "Users can send signals"
ON public.call_signals
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Users can view signals sent to them
CREATE POLICY "Users can view signals sent to them"
ON public.call_signals
FOR SELECT
USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Users can delete their signals
CREATE POLICY "Users can delete their signals"
ON public.call_signals
FOR DELETE
USING (auth.uid() = from_user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_call_signals_call_id ON public.call_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_to_user ON public.call_signals(to_user_id, created_at DESC);

-- Enable realtime for call_signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;