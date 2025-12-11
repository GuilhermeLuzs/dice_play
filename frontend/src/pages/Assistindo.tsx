import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Clock } from 'lucide-react';
import { CatalogSidebar } from '@/components/CatalogSidebar';
import { VideoCard } from '@/components/VideoCard';
import { VideoDetailsModal } from '@/components/VideoDetailsModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useVideos, Video } from '@/contexts/VideoContext';
import { cn } from '@/lib/utils'; // 1. Importar cn

export default function Assistindo() {
  const navigate = useNavigate();
  const { currentProfile, user } = useAuth();
  const { getWatchingVideos, getWatchProgress } = useVideos();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  
  // 2. Estado da Sidebar
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
      {/* 3. Passar controle */}
      <CatalogSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      {/* 4. Ajuste Dinâmico */}
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
        <div className="p-6">
          {watchingVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h2 className="font-display text-2xl mb-2">Nada em andamento</h2>
              <p className="text-muted-foreground max-w-md">
                Comece a assistir uma sessão e ela aparecerá aqui para você continuar de onde parou.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {watchingVideos.map(video => (
                <div key={video.id} className="relative">
                  <VideoCard
                    video={video}
                    onPlay={() => setPlayingVideo(video)}
                    onDetails={() => setSelectedVideo(video)}
                  />
                  <div className="absolute bottom-[88px] left-0 right-0 mx-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      {getWatchProgress(video.id)}% assistido
                    </div>
                  </div>
                </div>
              ))}
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
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
}