import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Video, fetchVideos, sampleVideos } from '@/lib/videoApi';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import Loader from './Loader';

interface VideoGridProps {
  categoria?: string;
}

const PAGE_SIZE = 20;

const VideoGrid = ({ categoria }: VideoGridProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const loadVideos = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      const data = await fetchVideos(pageNum, PAGE_SIZE, categoria);
      
      if (data.videos.length === 0 && pageNum === 1) {
        // DB empty, show sample data
        const filtered = categoria && categoria !== 'todos'
          ? sampleVideos.filter(v => v.categoria === categoria)
          : sampleVideos;
        setVideos(filtered);
        setHasMore(false);
      } else {
        setVideos(prev => reset ? data.videos : [...prev, ...data.videos]);
        setHasMore(pageNum < data.totalPages);
      }
    } catch {
      // Fallback to sample data on error
      if (pageNum === 1) {
        const filtered = categoria && categoria !== 'todos'
          ? sampleVideos.filter(v => v.categoria === categoria)
          : sampleVideos;
        setVideos(filtered);
        setHasMore(false);
      }
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

  const handlePlay = useCallback((video: Video) => {
    setSelectedVideo(video);
  }, []);

  if (loading && videos.length === 0) {
    return <Loader />;
  }

  if (videos.length === 0) {
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
        {videos.map((video, i) => (
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
