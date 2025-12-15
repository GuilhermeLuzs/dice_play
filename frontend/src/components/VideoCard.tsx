import { Play, Heart } from 'lucide-react';
import { useVideos, Video } from '@/contexts/VideoContext';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface VideoCardProps {
  video: Video;
  onPlay: () => void;
  onDetails: () => void;
  showFavorite?: boolean; // Prop opcional
}

export function VideoCard({ video, onPlay, onDetails, showFavorite = true }: VideoCardProps) {
  const { toggleFavorite, isFavorite, getWatchProgress } = useVideos();
  const favorite = isFavorite(video.id);
  
  // 1. Pega os segundos assistidos
  const currentSeconds = getWatchProgress(video.id);

  // 2. Converte a string de duração "HH:MM:SS" para segundos totais
  const totalDurationSeconds = useMemo(() => {
    if (!video.duration) return 0;
    const parts = video.duration.split(':').map(Number);
    
    // Formato HH:MM:SS
    if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    // Formato MM:SS (fallback)
    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    }
    return 0;
  }, [video.duration]);

  // 3. Calcula a porcentagem real (0 a 100)
  const percentage = useMemo(() => {
    if (totalDurationSeconds === 0) return 0;
    const pct = (currentSeconds / totalDurationSeconds) * 100;
    return Math.min(100, Math.max(0, pct)); // Trava entre 0% e 100%
  }, [currentSeconds, totalDurationSeconds]);

  const getRatingColor = (rating: string) => {
    if (rating === 'L') return 'bg-green-500';
    const num = parseInt(rating);
    if (num <= 10) return 'bg-green-500';
    if (num <= 12) return 'bg-yellow-500';
    if (num <= 14) return 'bg-orange-500';
    if (num <= 16) return 'bg-red-500';
    return 'bg-red-700';
  };

  return (
    <div 
      className="group relative flex-shrink-0 w-[280px] rounded-lg overflow-hidden bg-card cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl"
      onClick={onDetails}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 card-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge */}
        <div className={cn(
          "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white",
          getRatingColor(video.rating)
        )}>
          {video.rating}
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-0.5 rounded text-xs font-medium">
          {video.duration}
        </div>

        {/* Progress Bar */}
        {percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}

        {/* Play Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:bg-primary transition-colors glow-primary">
            <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          
          {/* BOTÃO DE FAVORITO CONDICIONAL */}
          {showFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(video.id);
              }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <Heart 
                className={cn(
                  "w-4 h-4 transition-colors",
                  favorite ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
                )} 
              />
            </button>
          )}

        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <img 
            src={video.channelAvatar} 
            alt={video.channelName}
            className="w-5 h-5 rounded-full"
          />
          <span className="text-xs text-muted-foreground truncate">{video.channelName}</span>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{video.views.toLocaleString()} views</span>
          <span>•</span>
          <span>{new Date(video.publishedAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}