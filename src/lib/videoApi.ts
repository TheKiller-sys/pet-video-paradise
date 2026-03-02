export interface Video {
  id: string;
  titulo: string;
  url: string;
  thumbnail: string | null;
  fuente: 'reddit' | 'youtube';
  categoria: 'perros' | 'gatos' | 'otros' | 'curiosidades';
  fecha_extraccion: string;
  activo: boolean;
  likes: number;
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

  if (!res.ok) throw new Error('Error fetching videos');
  return res.json();
}

export async function likeVideo(id: string): Promise<number> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/like-video`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    }
  );

  if (!res.ok) throw new Error('Error liking video');
  const data = await res.json();
  return data.likes;
}

export function getLikedVideos(): Set<string> {
  try {
    const stored = localStorage.getItem('liked_videos');
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

export function saveLikedVideo(id: string) {
  const liked = getLikedVideos();
  liked.add(id);
  localStorage.setItem('liked_videos', JSON.stringify([...liked]));
}

export function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export async function shareVideo(video: Video) {
  const shareData = {
    title: video.titulo,
    text: `¡Mira este video de mascotas! ${video.titulo}`,
    url: video.url,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch {
      // User cancelled
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(video.url);
    return true;
  } catch {
    return false;
  }
}
