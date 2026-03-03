import { Video, getYouTubeId, likeVideo, saveLikedVideo, getLikedVideos, shareVideo } from '@/lib/videoApi';
import { X, Heart, Share2, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ReelsViewerProps {
  videos: Video[];
  startIndex: number;
  onClose: () => void;
  onLoadMore: () => void;
}

const ReelsViewer = ({ videos, startIndex, onClose, onLoadMore }: ReelsViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isTransitioning = useRef(false);

  const video = videos[currentIndex];

  useEffect(() => {
    const liked = getLikedVideos();
    const map: Record<string, boolean> = {};
    const lMap: Record<string, number> = {};
    videos.forEach(v => {
      map[v.id] = liked.has(v.id);
      lMap[v.id] = v.likes || 0;
    });
    setLikedMap(map);
    setLikesMap(lMap);
  }, [videos]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const navigate = useCallback((direction: 'up' | 'down') => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setTimeout(() => { isTransitioning.current = false; }, 400);

    if (direction === 'down' && currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (currentIndex >= videos.length - 3) onLoadMore();
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, videos.length, onLoadMore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' || e.key === 'j') navigate('down');
      if (e.key === 'ArrowUp' || e.key === 'k') navigate('up');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, navigate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) {
        navigate(e.deltaY > 0 ? 'down' : 'up');
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [navigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? 'down' : 'up');
    }
  };

  const handleLike = async () => {
    if (!video || likedMap[video.id]) return;
    setAnimatingId(video.id);
    setLikedMap(prev => ({ ...prev, [video.id]: true }));
    setLikesMap(prev => ({ ...prev, [video.id]: (prev[video.id] || 0) + 1 }));
    saveLikedVideo(video.id);
    try {
      const newLikes = await likeVideo(video.id);
      setLikesMap(prev => ({ ...prev, [video.id]: newLikes }));
    } catch {}
    setTimeout(() => setAnimatingId(null), 600);
  };

  const handleShare = async () => {
    if (!video) return;
    const success = await shareVideo(video);
    if (success) toast.success('¡Enlace copiado!');
  };

  if (!video) return null;

  const likes = likesMap[video.id] || 0;
  const liked = likedMap[video.id] || false;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
        {currentIndex + 1} / {videos.length}
      </div>

      {/* Navigation arrows (desktop) */}
      <div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button
          onClick={() => navigate('up')}
          disabled={currentIndex === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate('down')}
          disabled={currentIndex === videos.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Video content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ duration: 0.3 }}
          className="flex h-full w-full items-center justify-center"
        >
          <div className="relative flex h-full w-full max-w-lg flex-col items-center justify-center">
            {/* Video player */}
            <div className="relative w-full flex-1 flex items-center justify-center">
              {video.fuente === 'youtube' && getYouTubeId(video.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(video.url)}?autoplay=1&rel=0&modestbranding=1`}
                  className="aspect-video w-full max-h-[75vh] rounded-lg"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={video.titulo}
                />
              ) : video.fuente === 'reddit' ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  loop
                  className="max-h-[85vh] w-full rounded-lg object-contain"
                  src={video.url.includes('v.redd.it') ? `${video.url}/DASH_720.mp4` : video.url}
                >
                  Tu navegador no soporta video.
                </video>
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/60">
                  <p>No se pudo cargar el video</p>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                    Ver en sitio original
                  </a>
                </div>
              )}
            </div>

            {/* Side actions (like Reels/TikTok) */}
            <div className="absolute bottom-24 right-4 flex flex-col items-center gap-5 md:right-[-60px]">
              <button onClick={handleLike} className="flex flex-col items-center gap-1">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${liked ? 'bg-destructive/20' : 'bg-white/10'}`}>
                  <Heart
                    className={`h-6 w-6 text-white transition-transform ${animatingId === video.id ? 'scale-125' : ''}`}
                    fill={liked ? 'hsl(0 84% 60%)' : 'none'}
                    stroke={liked ? 'hsl(0 84% 60%)' : 'white'}
                  />
                </div>
                <span className="text-xs text-white/80">{likes > 0 ? likes : ''}</span>
              </button>

              <button onClick={handleShare} className="flex flex-col items-center gap-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-white/80">Compartir</span>
              </button>

              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                  <ExternalLink className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-white/80">Original</span>
              </a>
            </div>

            {/* Bottom title */}
            <div className="absolute bottom-6 left-4 right-20 z-10">
              <h2 className="text-base font-semibold text-white drop-shadow-lg line-clamp-2">
                {video.titulo}
              </h2>
              <span className="mt-1 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/80 backdrop-blur-sm">
                {video.fuente === 'youtube' ? '▶ YouTube' : '🔴 Reddit'} · {video.categoria}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Swipe hint on mobile */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/30 md:hidden">
        Desliza ↕ para más videos
      </div>
    </motion.div>
  );
};

export default ReelsViewer;
