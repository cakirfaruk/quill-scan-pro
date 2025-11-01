-- Fix RLS policies for shared analyses to allow friends to view shared content
DROP POLICY IF EXISTS "Users can view analyses shared with them" ON public.shared_analyses;
DROP POLICY IF EXISTS "Friends can view shared analyses" ON public.shared_analyses;

-- Allow viewing if:
-- 1. User owns the analysis
-- 2. Analysis is public
-- 3. Analysis is shared with them directly (shared_with_user_id)
-- 4. Analysis is shared with friends and they are friends with the owner
-- 5. Analysis is shared with specific friends and they are in the allowed list
CREATE POLICY "Users can view shared analyses"
ON public.shared_analyses
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true
  OR auth.uid() = shared_with_user_id
  OR (
    visibility_type = 'friends' 
    AND is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.friends
      WHERE status = 'accepted'
      AND (
        (user_id = auth.uid() AND friend_id = shared_analyses.user_id)
        OR (friend_id = auth.uid() AND user_id = shared_analyses.user_id)
      )
    )
  )
  OR (
    visibility_type = 'specific_friends'
    AND is_visible = true
    AND auth.uid() = ANY(allowed_user_ids)
  )
);

-- Allow friends to view analyses that belong to shared analyses they have access to
CREATE POLICY "Friends can view birth chart analyses"
ON public.birth_chart_analyses
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.shared_analyses
    WHERE shared_analyses.analysis_id = birth_chart_analyses.id
    AND shared_analyses.analysis_type = 'birth_chart'
    AND (
      shared_analyses.shared_with_user_id = auth.uid()
      OR (
        shared_analyses.visibility_type = 'friends'
        AND shared_analyses.is_visible = true
        AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND (
            (user_id = auth.uid() AND friend_id = shared_analyses.user_id)
            OR (friend_id = auth.uid() AND user_id = shared_analyses.user_id)
          )
        )
      )
      OR (
        shared_analyses.visibility_type = 'specific_friends'
        AND shared_analyses.is_visible = true
        AND auth.uid() = ANY(shared_analyses.allowed_user_ids)
      )
    )
  )
);

CREATE POLICY "Friends can view numerology analyses"
ON public.numerology_analyses
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.shared_analyses
    WHERE shared_analyses.analysis_id = numerology_analyses.id
    AND shared_analyses.analysis_type = 'numerology'
    AND (
      shared_analyses.shared_with_user_id = auth.uid()
      OR (
        shared_analyses.visibility_type = 'friends'
        AND shared_analyses.is_visible = true
        AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND (
            (user_id = auth.uid() AND friend_id = shared_analyses.user_id)
            OR (friend_id = auth.uid() AND user_id = shared_analyses.user_id)
          )
        )
      )
      OR (
        shared_analyses.visibility_type = 'specific_friends'
        AND shared_analyses.is_visible = true
        AND auth.uid() = ANY(shared_analyses.allowed_user_ids)
      )
    )
  )
);

CREATE POLICY "Friends can view compatibility analyses"
ON public.compatibility_analyses
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.shared_analyses
    WHERE shared_analyses.analysis_id = compatibility_analyses.id
    AND shared_analyses.analysis_type = 'compatibility'
    AND (
      shared_analyses.shared_with_user_id = auth.uid()
      OR (
        shared_analyses.visibility_type = 'friends'
        AND shared_analyses.is_visible = true
        AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND (
            (user_id = auth.uid() AND friend_id = shared_analyses.user_id)
            OR (friend_id = auth.uid() AND user_id = shared_analyses.user_id)
          )
        )
      )
      OR (
        shared_analyses.visibility_type = 'specific_friends'
        AND shared_analyses.is_visible = true
        AND auth.uid() = ANY(shared_analyses.allowed_user_ids)
      )
    )
  )
);

CREATE POLICY "Friends can view analysis history"
ON public.analysis_history
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.shared_analyses
    WHERE shared_analyses.analysis_id = analysis_history.id
    AND shared_analyses.analysis_type = analysis_history.analysis_type
    AND (
      shared_analyses.shared_with_user_id = auth.uid()
      OR (
        shared_analyses.visibility_type = 'friends'
        AND shared_analyses.is_visible = true
        AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND (
            (user_id = auth.uid() AND friend_id = shared_analyses.user_id)
            OR (friend_id = auth.uid() AND user_id = shared_analyses.user_id)
          )
        )
      )
      OR (
        shared_analyses.visibility_type = 'specific_friends'
        AND shared_analyses.is_visible = true
        AND auth.uid() = ANY(shared_analyses.allowed_user_ids)
      )
    )
  )
);