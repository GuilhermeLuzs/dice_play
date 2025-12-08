import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import videosData from '@/data/videos.json'; // REMOVIDO: Migrando para API
import api from '@/services/api'; // 🚨 IMPORTANTE: Serviço Axios para comunicação com a API
import { useToast } from '@/hooks/use-toast'; // Opcional, para feedback ao usuário

// --- INTERFACES E TIPOS DO FRONT-END (camelCase) ---

export interface Video {
  id: string; // pk_video da API
  title: string;
  description: string;
  thumbnail: string;
  link: string;
  publishedAt: string;
  channelName: string;
  channelAvatar: string;
  categories: string[]; // tags da API
  duration: string;
  rating: string;
  views: number;
  participants: string[];
  master: string;
}

interface WatchProgress {
  videoId: string;
  progress: number;
  lastWatched: string;
}

// Dados mínimos para adicionar um vídeo (Formato Laravel esperado pelo payload)
interface AddVideoData {
  link_video: string;
  descricao_video: string;
  classificacao_etaria_video: string;
  master: string;
  participantes: string[];
  tags: string[];
  // Campos adicionais do YT para a requisição POST (que o AdminVideos.tsx já monta)
  titulo_video: string;
  thumbnail_video: string;
  data_publicacao_video: string;
  duracao_video: string;
  visualizacoes_video: number;
  nome_canal_video: string;
  foto_canal_video: string;
}

interface VideoContextType {
  videos: Video[];
  favorites: string[];
  watchProgress: WatchProgress[];
  toggleFavorite: (videoId: string) => void;
  isFavorite: (videoId: string) => boolean;
  updateWatchProgress: (videoId: string, progress: number) => void;
  getWatchProgress: (videoId: string) => number;
  getFilteredVideos: (profileType: string, search?: string, category?: string) => Video[];
  getFilteredVideosByTags: (profileType: string, search?: string, selectedTags?: string[]) => Video[];
  getFavoriteVideos: (profileType: string) => Video[];
  getWatchingVideos: (profileType: string) => Video[];
  // Funções assíncronas para interagir com a API
  fetchVideos: () => Promise<void>; 
  addVideo: (videoData: any) => Promise<void>; 
  updateVideo: (id: string, updates: Partial<Video>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  getAllTags: (profileType: string) => string[];
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);


// --- HELPERS E MAPEAMENTO DE API ---

interface VideoAPI {
    pk_video: number;
    titulo_video: string;
    link_video: string;
    descricao_video: string;
    thumbnail_video: string;
    data_publicacao_video: string;
    classificacao_etaria_video: string;
    duracao_video: string;
    visualizacoes_video: number;
    nome_canal_video: string;
    foto_canal_video?: string;
    created_at: string;
    updated_at: string;
    
    participantes?: Array<{
        pk_participante: number;
        nome_participante: string;
        foto_participante: string;
        e_mestre_participante: string; // "1" para mestre, "0" para jogador
        fk_video: number;
        created_at: string;
        updated_at: string;
    }>;
    
    tags: Array<{
        pk_tag: number;
        nome_tag: string;
        created_at: string;
        updated_at: string;
        pivot: any;
    }>;
}

/**
 * Mapeia o objeto de vídeo retornado pelo Laravel (snake_case) para 
 * o formato esperado pelo Front-end (camelCase).
 */
const mapApiVideoToFrontVideo = (apiVideo: VideoAPI): Video => {
    // Extrai participantes
    const participantesArray = apiVideo.participantes || [];
    
    // Separa mestre dos outros participantes
    let master = 'Não Definido';
    const participants: string[] = [];
    
    if (Array.isArray(participantesArray)) {
        participantesArray.forEach(participante => {
            if (participante.e_mestre_participante === "1") {
                master = participante.nome_participante;
            } else {
                participants.push(participante.nome_participante);
            }
        });
    }
    
    return {
        id: String(apiVideo.pk_video), 
        title: apiVideo.titulo_video,
        link: apiVideo.link_video,
        description: apiVideo.descricao_video,
        thumbnail: apiVideo.thumbnail_video,
        publishedAt: apiVideo.data_publicacao_video,
        channelName: apiVideo.nome_canal_video,
        channelAvatar: apiVideo.foto_canal_video || '',
        duration: apiVideo.duracao_video,
        rating: apiVideo.classificacao_etaria_video,
        views: apiVideo.visualizacoes_video,
        master: master,
        participants: participants,
        
        // Mapeia as tags
        categories: apiVideo.tags.map(tag => tag.nome_tag),
    };
};

function getRatingLevel(rating: string): number {
  if (rating === 'L') return 0;
  return parseInt(rating) || 18;
}

function getMaxRatingForType(type: string): number {
  switch (type) {
    case 'infantil': return 0;
    case 'juvenil': return 14;
    case 'adulto': return 18;
    default: return 18;
  }
}

// --- PROVIDER PRINCIPAL ---

export function VideoProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>([]);
  const { toast } = useToast();

  // 🚨 NOVO: Função para buscar e mapear vídeos da API
  const fetchVideos = async () => {
    try {
      const response = await api.get('/videos');
      // Assume-se que a API retorna a lista de vídeos dentro de 'response.data.videos'
      const apiVideos = response.data.videos as VideoAPI[]; 
      
      const mappedVideos = apiVideos.map(mapApiVideoToFrontVideo);
      setVideos(mappedVideos);
      
      // Cache no localStorage para fallback/uso inicial
      localStorage.setItem('diceplay_videos', JSON.stringify(mappedVideos));

    } catch (error) {
      console.error("Erro ao carregar vídeos da API:", error);
      toast({ 
        title: "Erro de Conexão", 
        description: "Não foi possível carregar o catálogo de vídeos.", 
        variant: "destructive" 
      });
      // Fallback: Carregar do localStorage se a API falhar
      const storedVideos = localStorage.getItem('diceplay_videos');
      if (storedVideos) {
        setVideos(JSON.parse(storedVideos));
      }
    }
  };

  useEffect(() => {
    fetchVideos(); // Inicia o carregamento de vídeos da API
    
    // Manter favoritos e progresso no localStorage (para persistência local)
    const storedFavorites = localStorage.getItem('diceplay_favorites');
    const storedProgress = localStorage.getItem('diceplay_watch_progress');
    
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    if (storedProgress) setWatchProgress(JSON.parse(storedProgress));
  }, []);

  // --- Funções CRUD da API (Atualizadas) ---

  const addVideo = async (payload: AddVideoData) => {
    try {
      // O payload já está em snake_case (formato Laravel)
      const response = await api.post('/videos', payload);
      const newApiVideo = response.data.video as VideoAPI; 

      // Mapeia o novo vídeo retornado pela API
      const newVideo = mapApiVideoToFrontVideo(newApiVideo);

      setVideos(prev => {
        const updated = [...prev, newVideo];
        localStorage.setItem('diceplay_videos', JSON.stringify(updated));
        return updated;
      });
      toast({ title: "Sucesso", description: "Vídeo adicionado com sucesso." });
    } catch (error: any) {
      console.error("Erro ao adicionar vídeo:", error);
      const errorMessage = error.response?.data?.message || "Falha ao salvar o vídeo.";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      throw error;
    }
  };

  const updateVideo = async (id: string, updates: Partial<Video>) => {
    try {
      // Mapeamento inverso para enviar no formato snake_case esperado pelo Laravel
      const payload: any = {
        link_video: updates.link,
        descricao_video: updates.description,
        classificacao_etaria_video: updates.rating,
        master: updates.master,
        participantes: updates.participants,
        tags: updates.categories, 
      };

      // 🚨 Chama a rota PUT/PATCH para atualização
      await api.put(`/videos/${id}`, payload); 

      // Atualiza o estado local apenas com as alterações (otimista)
      setVideos(prev => {
        const updated = prev.map(v => v.id === id ? { ...v, ...updates } : v);
        localStorage.setItem('diceplay_videos', JSON.stringify(updated));
        return updated;
      });
      toast({ title: "Sucesso", description: "Vídeo atualizado com sucesso." });
    } catch (error: any) {
      console.error("Erro ao atualizar vídeo:", error);
      const errorMessage = error.response?.data?.message || "Falha ao atualizar o vídeo.";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      throw error;
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      // 🚨 Chama a rota DELETE
      await api.delete(`/videos/${id}`);

      // Atualiza o estado local
      setVideos(prev => {
        const updated = prev.filter(v => v.id !== id);
        localStorage.setItem('diceplay_videos', JSON.stringify(updated));
        return updated;
      });
      toast({ title: "Sucesso", description: "Vídeo excluído com sucesso." });
    } catch (error: any) {
      console.error("Erro ao excluir vídeo:", error);
      const errorMessage = error.response?.data?.message || "Falha ao excluir o vídeo.";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      throw error;
    }
  };

  // --- Demais Funções (Permanecem no localStorage) ---

  const toggleFavorite = (videoId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId];
      localStorage.setItem('diceplay_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (videoId: string) => favorites.includes(videoId);

  const updateWatchProgress = (videoId: string, progress: number) => {
    setWatchProgress(prev => {
      const existing = prev.findIndex(p => p.videoId === videoId);
      let updated: WatchProgress[];
      
      if (existing !== -1) {
        updated = [...prev];
        updated[existing] = { videoId, progress, lastWatched: new Date().toISOString() };
      } else {
        updated = [...prev, { videoId, progress, lastWatched: new Date().toISOString() }];
      }
      
      localStorage.setItem('diceplay_watch_progress', JSON.stringify(updated));
      return updated;
    });
  };

  const getWatchProgress = (videoId: string): number => {
    const found = watchProgress.find(p => p.videoId === videoId);
    return found?.progress || 0;
  };

  const getFilteredVideos = (profileType: string, search?: string, category?: string): Video[] => {
    const maxRating = getMaxRatingForType(profileType);
    
    return videos.filter(video => {
      const videoRating = getRatingLevel(video.rating);
      if (videoRating > maxRating) return false;
      
      if (search) {
        const searchLower = search.toLowerCase();
        if (!video.title.toLowerCase().includes(searchLower) &&
            !video.description.toLowerCase().includes(searchLower) &&
            !video.channelName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      if (category && !video.categories.includes(category)) {
        return false;
      }
      
      return true;
    });
  };

  const getFilteredVideosByTags = (profileType: string, search?: string, selectedTags?: string[]): Video[] => {
    const maxRating = getMaxRatingForType(profileType);
    
    return videos.filter(video => {
      const videoRating = getRatingLevel(video.rating);
      if (videoRating > maxRating) return false;
      
      if (search) {
        const searchLower = search.toLowerCase();
        if (!video.title.toLowerCase().includes(searchLower) &&
            !video.description.toLowerCase().includes(searchLower) &&
            !video.channelName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      if (selectedTags && selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => video.categories.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
  };

  const getAllTags = (profileType: string): string[] => {
    const maxRating = getMaxRatingForType(profileType);
    const tagsSet = new Set<string>();
    
    videos.forEach(video => {
      const videoRating = getRatingLevel(video.rating);
      if (videoRating <= maxRating) {
        video.categories.forEach(cat => tagsSet.add(cat));
      }
    });
    
    return Array.from(tagsSet).sort();
  };

  const getFavoriteVideos = (profileType: string): Video[] => {
    return getFilteredVideos(profileType).filter(v => favorites.includes(v.id));
  };

  const getWatchingVideos = (profileType: string): Video[] => {
    const watchingIds = watchProgress
      .filter(p => p.progress > 0 && p.progress < 100)
      .map(p => p.videoId);
    return getFilteredVideos(profileType).filter(v => watchingIds.includes(v.id));
  };


  return (
    <VideoContext.Provider value={{
      videos,
      favorites,
      watchProgress,
      toggleFavorite,
      isFavorite,
      updateWatchProgress,
      getWatchProgress,
      getFilteredVideos,
      getFilteredVideosByTags,
      getFavoriteVideos,
      getWatchingVideos,
      fetchVideos, 
      addVideo,
      updateVideo,
      deleteVideo,
      getAllTags
    }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideos() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideos must be used within a VideoProvider');
  }
  return context;
}