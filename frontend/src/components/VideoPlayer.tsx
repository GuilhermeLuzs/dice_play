import { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useVideos, Video } from '@/contexts/VideoContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

// Helper para extrair o ID do YouTube de qualquer link (url completa, encurtada, etc)
const getYouTubeID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const { startWatching, updateWatchProgress, getWatchProgress } = useVideos();
  const { toast } = useToast();
  
  // Referência para o Player nativo do YT
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [startTime, setStartTime] = useState(0);

  // 1. Ao abrir: Busca o tempo no Backend
  useEffect(() => {
    const initSession = async () => {
        try {
            const serverTime = await startWatching(video.id);
            const localTime = getWatchProgress(video.id);
            // Prioriza o servidor, se for 0 usa o local
            setStartTime(serverTime > 0 ? serverTime : localTime);
        } catch (error) {
            console.error("Erro ao sincronizar tempo", error);
        }
    };
    initSession();

    // Cleanup ao fechar o modal
    return () => {
        stopProgressTracking();
    };
  }, []);

  // 2. Extrai o ID do link
  const videoId = getYouTubeID(video.link);

  // 3. Configurações do Player Nativo
  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,      // Tenta dar autoplay
      controls: 1,      // Mostra controles
      modestbranding: 1,
      rel: 0,           // Não mostra vídeos relacionados de outros canais
      start: Math.floor(startTime) // Tenta iniciar no tempo certo direto pela config
    },
  };

  // --- EVENTOS DO PLAYER ---

  const onReady = (event: YouTubeEvent) => {
    console.log("Player Nativo Pronto!");
    playerRef.current = event.target;
    setIsLoading(false); // Remove o loading

    // Garante o seek se o parâmetro 'start' tiver falhado
    if (startTime > 0) {
        event.target.seekTo(startTime, true);
    }
  };

  const onStateChange = (event: YouTubeEvent) => {
    // Status: 1 = Reproduzindo, 2 = Pausado
    if (event.data === 1) {
        startProgressTracking();
    } else {
        stopProgressTracking();
        // Salva o progresso imediatamente ao pausar
        if (playerRef.current) {
            const time = playerRef.current.getCurrentTime();
            updateWatchProgress(video.id, time, true);
        }
    }
  };

  const onError = (event: YouTubeEvent) => {
    console.error("Erro Nativo YouTube:", event.data);
    setHasError(true);
    setIsLoading(false);
    toast({ title: "Erro", description: "Vídeo indisponível ou bloqueado.", variant: "destructive" });
  };

  // --- MONITORAMENTO DE TEMPO (Manual) ---
  const startProgressTracking = () => {
      stopProgressTracking(); // Limpa anterior se houver
      progressInterval.current = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
              const currentTime = playerRef.current.getCurrentTime();
              if (currentTime > 0) {
                  // Salva no contexto (sem forçar backend a cada segundo)
                  updateWatchProgress(video.id, currentTime, false);
              }
          }
      }, 2000); // Atualiza a cada 2 segundos
  };

  const stopProgressTracking = () => {
      if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
      }
  };

  if (!videoId) {
      return (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center text-white">
              <p>Link inválido: {video.link}</p>
              <Button onClick={onClose} className="ml-4">Fechar</Button>
          </div>
      )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-12 h-12 z-[60]"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-white/10">
        
        {/* Loading Overlay */}
        {isLoading && !hasError && (
            <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-white text-sm animate-pulse">Carregando YouTube...</p>
            </div>
        )}

        {/* Error Overlay */}
        {hasError && (
            <div className="absolute inset-0 z-20 bg-zinc-900 flex flex-col items-center justify-center">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <p className="text-white">Vídeo indisponível</p>
            </div>
        )}

        {/* COMPONENTE OFICIAL */}
        <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            onStateChange={onStateChange}
            onError={onError}
            className="w-full h-full"     // Classe do container
            iframeClassName="w-full h-full" // Classe do iframe
        />
      </div>
    </div>
  );
}