import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  titulo: string;
  url: string;
  thumbnail: string | null;
  fuente: 'reddit' | 'youtube';
  categoria: 'perros' | 'gatos' | 'otros' | 'curiosidades';
  fecha_extraccion: string;
  activo: boolean;
}

export interface VideosResponse {
  videos: Video[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const CATEGORIAS = [
  { slug: 'todos', label: 'Todos', emoji: '🐾' },
  { slug: 'perros', label: 'Perros', emoji: '🐕' },
  { slug: 'gatos', label: 'Gatos', emoji: '🐱' },
  { slug: 'curiosidades', label: 'Curiosidades', emoji: '✨' },
  { slug: 'otros', label: 'Otros', emoji: '🦜' },
] as const;

export async function fetchVideos(page: number, limit: number, categoria?: string): Promise<VideosResponse> {
  const { data, error } = await supabase.functions.invoke('get-videos', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  });

  // supabase.functions.invoke doesn't support query params well for GET,
  // so let's use fetch directly
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (categoria && categoria !== 'todos') {
    params.set('categoria', categoria);
  }

  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/get-videos?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error fetching videos');
  }

  return res.json();
}

// Fallback mock data for when DB is empty
const defaultThumbnail = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop';

export const sampleVideos: Video[] = [
  {
    id: 'sample-1',
    titulo: 'Este perrito no puede dejar de sonreír 😍',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
    fuente: 'youtube',
    categoria: 'perros',
    fecha_extraccion: new Date().toISOString(),
    activo: true,
  },
  {
    id: 'sample-2',
    titulo: 'Gato ninja hace acrobacias increíbles',
    url: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs',
    thumbnail: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop',
    fuente: 'youtube',
    categoria: 'gatos',
    fecha_extraccion: new Date().toISOString(),
    activo: true,
  },
  {
    id: 'sample-3',
    titulo: 'Golden Retriever aprende a abrir la nevera',
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    thumbnail: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
    fuente: 'youtube',
    categoria: 'perros',
    fecha_extraccion: new Date().toISOString(),
    activo: true,
  },
  {
    id: 'sample-4',
    titulo: 'Gatito adopta a cachorro huérfano',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    thumbnail: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=300&fit=crop',
    fuente: 'reddit',
    categoria: 'gatos',
    fecha_extraccion: new Date().toISOString(),
    activo: true,
  },
  {
    id: 'sample-5',
    titulo: 'Hamster escapa de laberinto imposible',
    url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    thumbnail: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
    fuente: 'youtube',
    categoria: 'curiosidades',
    fecha_extraccion: new Date().toISOString(),
    activo: true,
  },
  {
    id: 'sample-6',
    titulo: 'Perro pastor organiza a 100 ovejas solo',
    url: 'https://www.youtube.com/watch?v=hT_nvWreIhg',
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=500&fit=crop',
    fuente: 'reddit',
    categoria: 'perros',
    fecha_extraccion: new Date().toISOString(),
    activo: true,
  },
];
