import { Video, getYouTubeId, likeVideo, saveLikedVideo, getLikedVideos, shareVideo } from '@/lib/videoApi';
import { X, Heart, Share2, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VideoModalProps {
  video: Video | null;
  onClose: () => void;
}

const VideoModal = ({ video, onClose }: VideoModalProps) => {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (video) {
      setLikes(video.likes || 0);
      setLiked(getLikedVideos().has(video.id));
    }
  }, [video]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (video) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [video, onClose]);

  const handleLike = async () => {
    if (!video || liked) return;
    setAnimating(true);
    setLiked(true);
    setLikes(prev => prev + 1);
    saveLikedVideo(video.id);
    try {
      const newLikes = await likeVideo(video.id);
      setLikes(newLikes);
    } catch {}
    setTimeout(() => setAnimating(false), 600);
  };

  const handleShare = async () => {
    if (!video) return;
    const success = await shareVideo(video);
    if (success) toast.success('¡Enlace copiado!');
  };

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-base font-semibold text-card-foreground line-clamp-1 pr-4">
                {video.titulo}
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video */}
            <div className="aspect-video w-full bg-foreground/5">
              {video.fuente === 'youtube' && getYouTubeId(video.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(video.url)}?autoplay=1`}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={video.titulo}
                />
              ) : video.fuente === 'reddit' ? (
                <video
                  controls
                  autoPlay
                  className="h-full w-full"
                  src={video.url.includes('v.redd.it') ? `${video.url}/DASH_720.mp4` : video.url}
                >
                  Tu navegador no soporta la reproducción de video.
                </video>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <p className="text-sm">No se pudo cargar el video</p>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                    Ver en sitio original
                  </a>
                </div>
              )}
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    liked
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive'
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 transition-transform ${animating ? 'scale-125' : ''}`}
                    fill={liked ? 'currentColor' : 'none'}
                  />
                  {likes > 0 ? `${likes} me gusta` : 'Me gusta'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                  Compartir
                </button>
              </div>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Original
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoModal;
