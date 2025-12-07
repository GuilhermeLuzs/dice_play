import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Users, Star, Tv, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VideoCarousel } from '@/components/VideoCarousel';
import { VideoDetailsModal } from '@/components/VideoDetailsModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Video } from '@/contexts/VideoContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import videosData from '@/data/videos.json';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  const allVideos = videosData.videos as Video[];
  const featuredVideo = allVideos[0];
  const popularVideos = [...allVideos].sort((a, b) => b.views - a.views).slice(0, 6);
  const recentVideos = [...allVideos].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 6);

  const features = [
    { icon: Tv, title: 'Sessões em HD', desc: 'Assista em alta qualidade' },
    { icon: Users, title: 'Mesas Épicas', desc: 'Das mais famosas às descobertas' },
    { icon: Star, title: 'Conteúdo Exclusivo', desc: 'Sessões únicas e originais' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button>Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
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
            <h1 className="font-display text-5xl md:text-7xl leading-tight mb-4">
              <span className="text-gradient">Aventuras</span> que
              <br />Rolam os Dados
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              A maior plataforma de streaming de sessões de RPG. 
              Das mesas mais famosas aos talentos sendo descobertos.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/cadastro">
                <Button size="lg" className="gap-2 text-lg glow-primary">
                  <Play className="w-5 h-5" fill="currentColor" />
                  Começar Agora
                </Button>
              </Link>
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </div>
      </section>

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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <VideoCarousel 
            title="🔥 Mais Populares"
            videos={popularVideos}
            onPlay={(video) => {
              if (!isAuthenticated) {
                toast({
                  title: "Login necessário",
                  description: "Faça login para assistir aos vídeos.",
                  variant: "destructive"
                });
                navigate('/login');
                return;
              }
              setPlayingVideo(video);
            }}
            onDetails={setSelectedVideo}
          />
        </div>
      </section>

      {/* Recent Videos */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <VideoCarousel 
            title="✨ Lançamentos Recentes"
            videos={recentVideos}
            onPlay={(video) => {
              if (!isAuthenticated) {
                toast({
                  title: "Login necessário",
                  description: "Faça login para assistir aos vídeos.",
                  variant: "destructive"
                });
                navigate('/login');
                return;
              }
              setPlayingVideo(video);
            }}
            onDetails={setSelectedVideo}
          />
        </div>
      </section>

      {/* CTA */}
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
