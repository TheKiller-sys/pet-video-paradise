import { Play, Youtube, Heart, Share2 } from 'lucide-react';
import { Video, likeVideo, saveLikedVideo, getLikedVideos, shareVideo } from '@/lib/videoApi';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  index: number;
}

const RedditIcon = () => (
  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5.9 11.3c.1.4.1.8 0 1.1-.3 1.2-1.7 2.2-3.6 2.6-.5.1-1 .2-1.5.2h-1.6c-.5 0-1-.1-1.5-.2-1.9-.4-3.3-1.4-3.6-2.6-.1-.4-.1-.8 0-1.1.1-.3.2-.6.4-.8-.1-.3-.1-.7 0-1 .2-.5.5-.8.9-.9 0 0 0 0 0 0-.8-.7-1.2-1.5-1.2-2.3 0-.3.2-.5.5-.5s.5.2.5.5c0 .6.4 1.3 1.2 1.8.5-1 1.6-1.8 3-2.1l.5-1.5c.1-.2.3-.4.5-.4l2 .1c.2 0 .4.1.4.3l.2.9c.2.1.3.2.4.3.4.1.7.5.9.9.1.3.1.7 0 1 .2.3.3.5.4.8z" />
  </svg>
);

const VideoCard = ({ video, onPlay, index }: VideoCardProps) => {
  const [likes, setLikes] = useState(video.likes || 0);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setLiked(getLikedVideos().has(video.id));
  }, [video.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) return;

    setAnimating(true);
    setLiked(true);
    setLikes(prev => prev + 1);
    saveLikedVideo(video.id);

    try {
      const newLikes = await likeVideo(video.id);
      setLikes(newLikes);
    } catch {
      // Keep optimistic update
    }

    setTimeout(() => setAnimating(false), 600);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await shareVideo(video);
    if (success) {
      toast.success('¡Enlace copiado!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="masonry-item"
    >
      <div
        className="group cursor-pointer overflow-hidden rounded-xl bg-card shadow-card transition-shadow duration-300 hover:shadow-card-hover"
        onClick={() => onPlay(video)}
      >
        <div className="relative overflow-hidden">
          <img
            src={video.thumbnail || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop'}
            alt={video.titulo}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-card-foreground line-clamp-2 leading-snug">
            {video.titulo}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              video.fuente === 'youtube'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
            }`}>
              {video.fuente === 'youtube' ? <Youtube className="h-3 w-3" /> : <RedditIcon />}
              {video.fuente === 'youtube' ? 'YouTube' : 'Reddit'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                title="Compartir"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all ${
                  liked
                    ? 'text-destructive'
                    : 'text-muted-foreground hover:text-destructive'
                }`}
                title="Me gusta"
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-transform ${animating ? 'scale-125' : ''}`}
                  fill={liked ? 'currentColor' : 'none'}
                />
                {likes > 0 && <span>{likes}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
