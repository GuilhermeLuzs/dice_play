import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { Video } from '@/contexts/VideoContext';
import { Button } from '@/components/ui/button';

interface VideoCarouselProps {
  title: string;
  videos: Video[];
  onPlay: (video: Video) => void;
  onDetails: (video: Video) => void;
}

export function VideoCarousel({ title, videos, onPlay, onDetails }: VideoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 600;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (videos.length === 0) return null;

  return (
    <div className="relative group/carousel">
      <h2 className="font-display text-2xl mb-4 text-foreground">{title}</h2>
      
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background opacity-0 group-hover/carousel:opacity-100 transition-opacity rounded-full shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {/* Videos */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1"
        >
          {videos.map(video => (
            <VideoCard 
              key={video.id} 
              video={video}
              onPlay={() => onPlay(video)}
              onDetails={() => onDetails(video)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background opacity-0 group-hover/carousel:opacity-100 transition-opacity rounded-full shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
