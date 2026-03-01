
-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  thumbnail TEXT,
  fuente TEXT NOT NULL CHECK (fuente IN ('reddit', 'youtube')),
  categoria TEXT NOT NULL DEFAULT 'otros' CHECK (categoria IN ('perros', 'gatos', 'otros', 'curiosidades')),
  fecha_extraccion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_videos_categoria ON public.videos(categoria);
CREATE INDEX idx_videos_fecha ON public.videos(fecha_extraccion DESC);
CREATE INDEX idx_videos_url ON public.videos(url);

-- Enable RLS (public read, protected write)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Anyone can read active videos
CREATE POLICY "Videos are publicly readable"
  ON public.videos FOR SELECT
  USING (activo = true);

-- Only service role can insert/update/delete (via edge functions)
CREATE POLICY "Service role can manage videos"
  ON public.videos FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
