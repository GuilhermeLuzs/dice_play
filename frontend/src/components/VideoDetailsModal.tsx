import { X, Play, Heart, Calendar, Clock, Eye, Users, Crown, Tag } from 'lucide-react';
import { Video, useVideos } from '@/contexts/VideoContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VideoDetailsModalProps {
  video: Video;
  onClose: () => void;
  onPlay: () => void;
}

export function VideoDetailsModal({ video, onClose, onPlay }: VideoDetailsModalProps) {
  const { toggleFavorite, isFavorite } = useVideos();
  const favorite = isFavorite(video.id);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-xl shadow-2xl animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/50 hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative aspect-video">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={onPlay}
              size="lg"
              className="gap-2 text-lg glow-primary"
            >
              <Play className="w-6 h-6" fill="currentColor" />
              Assistir Agora
            </Button>
          </div>

          {/* Rating */}
          <div className={cn(
            "absolute top-4 left-4 px-3 py-1 rounded text-sm font-bold text-white",
            getRatingColor(video.rating)
          )}>
            {video.rating === 'L' ? 'Livre' : `${video.rating} anos`}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title & Favorite */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl md:text-4xl text-card-foreground">
              {video.title}
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleFavorite(video.id)}
              className={cn(favorite && "border-primary text-primary")}
            >
              <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
            </Button>
          </div>

          {/* Channel */}
          <div className="flex items-center gap-3">
            <img 
              src={video.channelAvatar} 
              alt={video.channelName}
              className="w-12 h-12 rounded-full border-2 border-primary"
            />
            <div>
              <p className="font-semibold text-card-foreground">{video.channelName}</p>
              <p className="text-sm text-muted-foreground">Canal</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(video.publishedAt).toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {video.duration}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {video.views.toLocaleString()} visualizações
            </div>
          </div>

          {/* Description */}
          <p className="text-card-foreground/80 leading-relaxed">
            {video.description}
          </p>

          {/* Categories */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="w-4 h-4" />
              Categorias
            </div>
            <div className="flex flex-wrap gap-2">
              {video.categories.map(cat => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Master */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="w-4 h-4 text-yellow-500" />
              Mestre da Sessão
            </div>
            <p className="font-medium text-card-foreground">{video.master}</p>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              Participantes
            </div>
            <div className="flex flex-wrap gap-2">
              {video.participants.map(participant => (
                <Badge key={participant} variant="outline">
                  {participant}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
