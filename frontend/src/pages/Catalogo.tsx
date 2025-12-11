import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, Check } from 'lucide-react';
import { CatalogSidebar } from '@/components/CatalogSidebar';
import { VideoCarousel } from '@/components/VideoCarousel';
import { VideoDetailsModal } from '@/components/VideoDetailsModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useVideos, Video } from '@/contexts/VideoContext';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function Catalogo() {
  const navigate = useNavigate();
  const { currentProfile, user } = useAuth();
  const { getFilteredVideosByTags, getAllTags } = useVideos();
  
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  
  // Este estado agora controla a Sidebar DE VERDADE
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [filterOpen, setFilterOpen] = useState(false);

  // Redirecionamentos de segurança
  if (!user) {
    navigate('/login');
    return null;
  }

  if (!currentProfile) {
    navigate('/perfis');
    return null;
  }

  const profileType = currentProfile.type;
  const allVideos = getFilteredVideosByTags(profileType, search, selectedTags.length > 0 ? selectedTags : undefined);
  const categories = getAllTags(profileType);

  // Agrupamento de vídeos
  const groupedVideos = useMemo(() => {
    const groups: { [key: string]: Video[] } = {};
    
    categories.forEach(cat => {
      const vids = allVideos.filter(v => v.categories.includes(cat));
      if (vids.length > 0) {
        groups[cat] = vids;
      }
    });
    
    return groups;
  }, [allVideos, categories]);

  const popularVideos = [...allVideos].sort((a, b) => b.views - a.views).slice(0, 10);
  const recentVideos = [...allVideos]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Agora a Sidebar recebe e respeita o estado */}
      <CatalogSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 min-w-0 transition-all duration-300",
        // A margem esquerda agora reage corretamente ao estado sidebarCollapsed
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        
        {/* Header */}
        <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
          <div className="p-4 w-full">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
              
              {/* Title Section */}
              <div className="shrink-0">
                <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Catálogo</h1>
                <p className="text-sm text-muted-foreground">
                  Conteúdo {profileType === 'infantil' ? 'Infantil' : profileType === 'juvenil' ? 'Juvenil' : 'Adulto'}
                </p>
              </div>
              
              {/* Search & Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto md:flex-1 md:justify-end min-w-0">
                
                {/* Search Container */}
                <div className="relative flex-1 md:flex-none md:w-80 lg:w-96 max-w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar sessões..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 w-full bg-background/50 focus:bg-background transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>

                {/* Filter Popover */}
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative shrink-0 bg-background/50 hover:bg-background">
                      <Filter className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Filtrar</span>
                      {selectedTags.length > 0 && (
                        <Badge 
                          variant="default" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                        >
                          {selectedTags.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 bg-popover z-50" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none">Filtrar por Tags</h4>
                        {selectedTags.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={clearFilters}
                            className="text-xs h-7 px-2"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {categories.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all border",
                              selectedTags.includes(tag)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 hover:bg-muted border-transparent hover:border-border text-foreground"
                            )}
                          >
                            {selectedTags.includes(tag) && <Check className="w-3 h-3" />}
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Active Filters Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors px-2 py-1"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 space-y-8 pb-20">
          {search || selectedTags.length > 0 ? (
            // Search/Filter Results
            <div className="animate-in fade-in duration-500">
              <h2 className="font-display text-xl sm:text-2xl mb-6 flex items-baseline gap-2">
                <span>Resultados da busca</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({allVideos.length} {allVideos.length !== 1 ? 'vídeos encontrados' : 'vídeo encontrado'})
                </span>
              </h2>
              
              {allVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10 border-dashed">
                  <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-1">Nenhum vídeo encontrado</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Não encontramos resultados para sua busca. Tente termos diferentes ou remova os filtros.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {allVideos.map(video => (
                    <div 
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className="group cursor-pointer space-y-2"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="bg-background/90 text-foreground rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                           </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{video.channelName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-700">
              {/* Popular */}
              {popularVideos.length > 0 && (
                <VideoCarousel
                  title="🔥 Mais Populares"
                  videos={popularVideos}
                  onPlay={setPlayingVideo}
                  onDetails={setSelectedVideo}
                />
              )}

              {/* Recent */}
              {recentVideos.length > 0 && (
                <VideoCarousel
                  title="✨ Adicionados Recentemente"
                  videos={recentVideos}
                  onPlay={setPlayingVideo}
                  onDetails={setSelectedVideo}
                />
              )}

              {/* By Category */}
              {Object.entries(groupedVideos).map(([category, videos]) => (
                <VideoCarousel
                  key={category}
                  title={category}
                  videos={videos}
                  onPlay={setPlayingVideo}
                  onDetails={setSelectedVideo}
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