import { useState, useMemo, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Video, mockVideos } from '@/lib/mockData';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import Loader from './Loader';

interface VideoGridProps {
  categoria?: string;
}

const PAGE_SIZE = 20;

const VideoGrid = ({ categoria }: VideoGridProps) => {
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const filteredVideos = useMemo(() => {
    if (!categoria || categoria === 'todos') return mockVideos;
    return mockVideos.filter((v) => v.categoria === categoria);
  }, [categoria]);

  const visibleVideos = useMemo(
    () => filteredVideos.slice(0, page * PAGE_SIZE),
    [filteredVideos, page]
  );

  const hasMore = visibleVideos.length < filteredVideos.length;

  const { ref } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasMore) setPage((p) => p + 1);
    },
  });

  const handlePlay = useCallback((video: Video) => {
    setSelectedVideo(video);
  }, []);

  if (filteredVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <span className="text-5xl mb-4">🐾</span>
        <p className="text-lg font-medium">No hay videos en esta categoría</p>
      </div>
    );
  }

  return (
    <>
      <div className="masonry-grid">
        {visibleVideos.map((video, i) => (
          <VideoCard key={video.id} video={video} onPlay={handlePlay} index={i} />
        ))}
      </div>
      {hasMore && (
        <div ref={ref}>
          <Loader />
        </div>
      )}
      <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </>
  );
};

export default VideoGrid;
