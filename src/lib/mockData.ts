export interface Video {
  id: string;
  titulo: string;
  url: string;
  thumbnail: string;
  fuente: 'reddit' | 'youtube';
  categoria: 'perros' | 'gatos' | 'otros' | 'curiosidades';
  fecha_extraccion: string;
  activo: boolean;
}

export const CATEGORIAS = [
  { slug: 'todos', label: 'Todos', emoji: '🐾' },
  { slug: 'perros', label: 'Perros', emoji: '🐕' },
  { slug: 'gatos', label: 'Gatos', emoji: '🐱' },
  { slug: 'curiosidades', label: 'Curiosidades', emoji: '✨' },
  { slug: 'otros', label: 'Otros', emoji: '🦜' },
] as const;

const thumbnails = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=350&fit=crop',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&h=450&fit=crop',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=320&fit=crop',
];

const titles = [
  "Este perrito no puede dejar de sonreír 😍",
  "Gato ninja hace acrobacias increíbles",
  "Golden Retriever aprende a abrir la nevera",
  "Gatito adopta a cachorro huérfano",
  "Perro salva a su dueño de caer al río",
  "Loro imita perfectamente a Alexa",
  "Cachorro ve nieve por primera vez",
  "Gato contra pepino: la batalla final",
  "Hamster escapa de laberinto imposible",
  "Perro pastor organiza a 100 ovejas solo",
  "Gato DJ pone música en la fiesta",
  "Pato sigue a su dueño por toda la ciudad",
  "Perro husky canta ópera dramáticamente",
  "Gatito intenta cazar su propia cola",
  "Tortuga gana carrera contra perro",
  "Cachorro labrador aprende a nadar",
  "Gato callejero adopta a familia humana",
  "Perro aprende 50 trucos nuevos",
  "Conejo hace parkour en el jardín",
  "Gatitos gemelos hacen todo sincronizado",
  "Perro policía en su día libre",
  "Mapache roba comida del camping",
  "Caballo baila al ritmo de la música",
  "Gatito ayuda a hacer la cama",
  "Perro espera a su dueño en la estación",
  "Pez payaso reconoce a su dueño",
  "Cerdo miniatura vive como un rey",
  "Perro adopta a gatitos abandonados",
  "Búho bebé descubre sus propias patas",
  "Gato aprende a usar el inodoro",
];

const youtubeIds = [
  'dQw4w9WgXcQ', 'ZbZSe6N_BXs', '9bZkp7q19f0', 'kJQP7kiw5Fk',
  'JGwWNGJdvx8', 'hT_nvWreIhg', 'OPf0YbXqDm0', 'fJ9rUzIMcZQ',
];

const categorias: Video['categoria'][] = ['perros', 'gatos', 'otros', 'curiosidades'];

export function generateMockVideos(count: number = 60): Video[] {
  return Array.from({ length: count }, (_, i) => {
    const isYouTube = Math.random() > 0.4;
    const categoria = categorias[i % categorias.length];
    return {
      id: `video-${i + 1}`,
      titulo: titles[i % titles.length],
      url: isYouTube
        ? `https://www.youtube.com/watch?v=${youtubeIds[i % youtubeIds.length]}`
        : `https://v.redd.it/example${i}`,
      thumbnail: thumbnails[i % thumbnails.length],
      fuente: isYouTube ? 'youtube' : 'reddit',
      categoria,
      fecha_extraccion: new Date(Date.now() - i * 3600000).toISOString(),
      activo: true,
    };
  });
}

export const mockVideos = generateMockVideos();
