
-- Add likes column to videos table
ALTER TABLE public.videos ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;

-- Allow anon users to read all active videos (already exists, but ensure it's permissive)
DROP POLICY IF EXISTS "Videos are publicly readable" ON public.videos;
CREATE POLICY "Videos are publicly readable"
  ON public.videos FOR SELECT
  USING (activo = true);
