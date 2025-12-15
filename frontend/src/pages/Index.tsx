import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Users, Star, Tv, ChevronDown, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VideoCarousel } from '@/components/VideoCarousel';
import { VideoDetailsModal } from '@/components/VideoDetailsModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useVideos, Video } from '@/contexts/VideoContext';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const navigate = useNavigate();
  // 1. Desestruturamos o 'user' para verificar se é admin
  const { isAuthenticated, currentProfile, user } = useAuth(); 
  const { toast } = useToast();
  const { videos, isLoading } = useVideos();

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  const { popularVideos, recentVideos, featuredVideo } = useMemo(() => {
    if (videos.length === 0) return { popularVideos: [], recentVideos: [], featuredVideo: null };

    const sortedByViews = [...videos].sort((a, b) => b.views - a.views).slice(0, 6);
    const sortedByDate = [...videos].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ).slice(0, 6);
    
    const featured = sortedByViews[0] || videos[0];

    return {
        popularVideos: sortedByViews,
        recentVideos: sortedByDate,
        featuredVideo: featured
    };
  }, [videos]);

  // --- LÓGICA DE PROTEÇÃO DO PLAYER ---
  const handlePlayAttempt = (video: Video) => {
    // 1. Verifica se está logado
    if (!isAuthenticated) {
        toast({
            title: "Acesso Restrito",
            description: "Faça login ou crie uma conta para assistir.",
            variant: "default"
        });
        navigate('/login');
        return;
    }

    // 2. BLOQUEIO DE ADMIN (NOVA LÓGICA)
    if (user?.is_admin === '1') {
        toast({
            title: "Acesso de Administrador",
            description: "Contas administrativas não podem assistir conteúdo. Por favor, entre com uma conta de usuário comum.",
            variant: "destructive" 
        });
        return;
    }

    // 3. Verifica se selecionou um perfil
    if (!currentProfile) {
        toast({
            title: "Selecione um Perfil",
            description: "Você precisa escolher quem está assistindo.",
            variant: "default"
        });
        navigate('/perfis');
        return;
    }

    // 4. Se passou, libera o player
    setPlayingVideo(video);
  };

  const features = [
    { icon: Tv, title: 'Sessões em HD', desc: 'Assista em alta qualidade' },
    { icon: Users, title: 'Mesas Épicas', desc: 'Das mais famosas às descobertas' },
    { icon: Star, title: 'Conteúdo Exclusivo', desc: 'Sessões únicas e originais' },
  ];

  if (isLoading && videos.length === 0) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-background">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {!isAuthenticated ? (
                <>
                    <Link to="/login">
                        <Button variant="ghost">Entrar</Button>
                    </Link>
                    <Link to="/cadastro">
                        <Button>Cadastrar</Button>
                    </Link>
                </>
            ) : (
                // Se for Admin, mostra botão para ir pro Painel, senão Perfis
                user?.is_admin === '1' ? (
                    <Link to="/admin/videos">
                        <Button variant="outline">Painel Admin</Button>
                    </Link>
                ) : (
                    <Link to="/perfis">
                        <Button variant="outline">Meus Perfis</Button>
                    </Link>
                )
            )}
            
          </div>
        </div>
      </header>

      {/* Hero Dinâmico */}
      {featuredVideo && (
        <section className="relative h-screen flex items-center">
            <div className="absolute inset-0">
            <img 
                src={featuredVideo.thumbnail}
                alt="Hero"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            <div className="relative container mx-auto px-4 pt-20">
            <div className="max-w-2xl animate-slide-up">
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-tight mb-4">
                <span className="text-gradient line-clamp-2">{featuredVideo.title}</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 line-clamp-3">
                    {featuredVideo.description}
                </p>
                <div className="flex flex-wrap gap-4">
                <Button 
                    size="lg" 
                    className="gap-2 text-lg glow-primary"
                    onClick={() => handlePlayAttempt(featuredVideo)}
                >
                    <Play className="w-5 h-5" fill="currentColor" />
                    Assistir Agora
                </Button>
                
                <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setSelectedVideo(featuredVideo)}
                >
                    Saiba Mais
                </Button>
                </div>
            </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
            </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div 
                key={title}
                className="flex flex-col items-center text-center p-8 rounded-xl bg-card border border-border hover:border-primary transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-2xl mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Videos */}
      {popularVideos.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
            <VideoCarousel 
                title="🔥 Mais Populares"
                videos={popularVideos}
                onPlay={handlePlayAttempt} 
                onDetails={setSelectedVideo}
                showFavorite={false}
            />
            </div>
        </section>
      )}

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
          <section className="py-16 bg-secondary/20">
            <div className="container mx-auto px-4">
            <VideoCarousel 
                title="✨ Lançamentos Recentes"
                videos={recentVideos}
                onPlay={handlePlayAttempt} 
                onDetails={setSelectedVideo}
                showFavorite={false}
            />
            </div>
        </section>
      )}

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20">
            <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-4xl md:text-5xl mb-4">
                Pronto para <span className="text-gradient">Rolar os Dados</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Junte-se a milhares de aventureiros e descubra sessões incríveis de RPG.
            </p>
            <Link to="/cadastro">
                <Button size="lg" className="glow-primary">
                Criar Conta Grátis
                </Button>
            </Link>
            </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 Dice Play. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedVideo && (
        <VideoDetailsModal 
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onPlay={() => {
             setSelectedVideo(null);
             handlePlayAttempt(selectedVideo);
          }}
          showFavorite={false}
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