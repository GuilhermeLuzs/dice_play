import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Clock } from 'lucide-react';
import { CatalogSidebar } from '@/components/CatalogSidebar';
import { VideoCard } from '@/components/VideoCard';
import { VideoDetailsModal } from '@/components/VideoDetailsModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useVideos, Video } from '@/contexts/VideoContext';
import { cn } from '@/lib/utils';

// Helper para calcular porcentagem correta
function calculatePercentage(currentSeconds: number, durationStr: string): number {
  if (!durationStr) return 0;
  
  const parts = durationStr.split(':').map(Number);
  let totalSeconds = 0;

  if (parts.length === 3) {
    totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = (parts[0] * 60) + parts[1];
  }

  if (totalSeconds === 0) return 0;

  const pct = (currentSeconds / totalSeconds) * 100;
  return Math.min(100, Math.max(0, Math.floor(pct)));
}

export default function Assistindo() {
  const navigate = useNavigate();
  const { currentProfile, user } = useAuth();
  const { getWatchingVideos, getWatchProgress, loadUserProfileData } = useVideos();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!currentProfile) {
    navigate('/perfis');
    return null;
  }

  const watchingVideos = getWatchingVideos(currentProfile.type);

  return (
    <div className="min-h-screen bg-background">
      <CatalogSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      <main className={cn(
        "pt-16 lg:pt-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border p-6">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-display text-3xl">Continuar Assistindo</h1>
              <p className="text-sm text-muted-foreground">
                {watchingVideos.length} vídeo{watchingVideos.length !== 1 ? 's' : ''} em progresso
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 pb-20">
          {watchingVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
              <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h2 className="font-display text-2xl mb-2">Nada em andamento</h2>
              <p className="text-muted-foreground max-w-md">
                Comece a assistir uma sessão e ela aparecerá aqui para você continuar de onde parou.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {watchingVideos.map(video => {
                const currentSeconds = getWatchProgress(video.id);
                const percent = calculatePercentage(currentSeconds, video.duration);

                return (
                  <div key={video.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <VideoCard
                      video={video}
                      onPlay={() => setPlayingVideo(video)}
                      onDetails={() => setSelectedVideo(video)}
                    />
                    
                    {/* Badge de Porcentagem (Sobre o Card) */}
                    <div className="absolute top-2 right-2 z-20 pointer-events-none">
                         <div className={cn(
                            "flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded shadow-sm backdrop-blur-md transition-colors border",
                            percent >= 90 
                                ? "bg-green-500/90 text-white border-green-600" 
                                : "bg-black/60 text-white border-white/10"
                         )}>
                           <Clock className="w-3 h-3" />
                           {percent}%
                         </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedVideo && (
        <VideoDetailsModal 
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onPlay={() => {
            setPlayingVideo(selectedVideo);
            setSelectedVideo(null);
          }}
        />
      )}

      {playingVideo && (
        <VideoPlayer 
          video={playingVideo}
          onClose={() => {
             setPlayingVideo(null);
             if (currentProfile) loadUserProfileData(Number(currentProfile.id));
          }}
        />
      )}
    </div>
  );
}