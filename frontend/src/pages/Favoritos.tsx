import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { CatalogSidebar } from '@/components/CatalogSidebar';
import { VideoCard } from '@/components/VideoCard';
import { VideoDetailsModal } from '@/components/VideoDetailsModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useVideos, Video } from '@/contexts/VideoContext';

export default function Favoritos() {
  const navigate = useNavigate();
  const { currentProfile, user } = useAuth();
  const { getFavoriteVideos } = useVideos();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!currentProfile) {
    navigate('/perfis');
    return null;
  }

  const favoriteVideos = getFavoriteVideos(currentProfile.type);

  return (
    <div className="min-h-screen bg-background">
      <CatalogSidebar />
      
      <main className="pt-16 lg:pt-0 lg:ml-20 xl:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            <div>
              <h1 className="font-display text-3xl">Meus Favoritos</h1>
              <p className="text-sm text-muted-foreground">
                {favoriteVideos.length} vídeo{favoriteVideos.length !== 1 ? 's' : ''} favorito{favoriteVideos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {favoriteVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h2 className="font-display text-2xl mb-2">Nenhum favorito ainda</h2>
              <p className="text-muted-foreground max-w-md">
                Clique no coração nos vídeos para adicioná-los aos seus favoritos e acessá-los facilmente aqui.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {favoriteVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={() => setPlayingVideo(video)}
                  onDetails={() => setSelectedVideo(video)}
                />
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
