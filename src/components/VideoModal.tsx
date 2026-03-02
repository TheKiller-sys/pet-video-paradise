import { Video, getYouTubeId } from '@/lib/videoApi';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoModalProps {
  video: Video | null;
  onClose: () => void;
}

const VideoModal = ({ video, onClose }: VideoModalProps) => {
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
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline text-sm"
                  >
                    Ver en sitio original
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoModal;
