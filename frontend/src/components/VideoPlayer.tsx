import { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Video, useVideos } from '@/contexts/VideoContext';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const { getWatchProgress, updateWatchProgress } = useVideos();
  const [progress, setProgress] = useState(getWatchProgress(video.id));

  useEffect(() => {
    // Simulate progress update every 5 seconds
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 5, 100);
        updateWatchProgress(video.id, newProgress);
        return newProgress;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [video.id, updateWatchProgress]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-xl truncate mx-4">{video.title}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center">
        <iframe
          src={video.link}
          title={video.title}
          className="w-full h-full max-w-[1920px] aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
