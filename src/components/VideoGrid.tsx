import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Video, fetchVideos } from '@/lib/videoApi';
import VideoCard from './VideoCard';
import ReelsViewer from './ReelsViewer';
import Loader from './Loader';
import { AnimatePresence } from 'framer-motion';

interface VideoGridProps {
  categoria?: string;
}

const PAGE_SIZE = 20;

const VideoGrid = ({ categoria }: VideoGridProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reelIndex, setReelIndex] = useState<number | null>(null);

  const loadVideos = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      const data = await fetchVideos(pageNum, PAGE_SIZE, categoria);
      setVideos(prev => reset ? data.videos : [...prev, ...data.videos]);
      setHasMore(pageNum < data.totalPages);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [categoria]);

  useEffect(() => {
    setPage(1);
    setVideos([]);
    setHasMore(true);
    loadVideos(1, true);
  }, [categoria, loadVideos]);

  const { ref } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadVideos(nextPage);
      }
    },
  });

  const handleLoadMoreReels = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadVideos(nextPage);
    }
  }, [hasMore, loading, page, loadVideos]);

  const handlePlay = useCallback((video: Video) => {
    const idx = videos.findIndex(v => v.id === video.id);
    setReelIndex(idx >= 0 ? idx : 0);
  }, [videos]);

  if (loading && videos.length === 0) {
    return <Loader />;
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <span className="text-5xl mb-4">🐾</span>
        <p className="text-lg font-medium">No hay videos en esta categoría</p>
        <p className="text-sm mt-1">Ejecuta la extracción automática para poblar la base de datos</p>
      </div>
    );
  }

  return (
    <>
      <div className="masonry-grid">
        {videos.map((video, i) => (
          <VideoCard key={video.id} video={video} onPlay={handlePlay} index={i} />
        ))}
      </div>
      {hasMore && (
        <div ref={ref}>
          <Loader />
        </div>
      )}
      <AnimatePresence>
        {reelIndex !== null && (
          <ReelsViewer
            videos={videos}
            startIndex={reelIndex}
            onClose={() => setReelIndex(null)}
            onLoadMore={handleLoadMoreReels}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default VideoGrid;
