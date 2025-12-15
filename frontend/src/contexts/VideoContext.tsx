import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// --- INTERFACES ---

export interface Video {
  id: string; 
  title: string;
  description: string;
  thumbnail: string;
  link: string;
  publishedAt: string;
  channelName: string;
  channelAvatar: string;
  categories: string[]; 
  duration: string;
  rating: string;
  views: number;
  participants: string[];
  master: string;
  savedProgress?: number; // Vindo do backend (assistindo)
}

interface WatchProgress {
  videoId: string;
  progress: number;
  lastWatched: string;
}

interface AddVideoData {
  link_video: string;
  descricao_video: string;
  classificacao_etaria_video: string;
  master: string;
  participantes: string[];
  tags: string[];
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
  isLoading: boolean;
  
  toggleFavorite: (videoId: string) => void;
  isFavorite: (videoId: string) => boolean;
  
  // Player Actions
  startWatching: (videoId: string) => Promise<number>; 
  updateWatchProgress: (videoId: string, seconds: number, forceSave?: boolean) => void;
  getWatchProgress: (videoId: string) => number;
  
  getFilteredVideos: (profileType: string, search?: string, category?: string) => Video[];
  getFilteredVideosByTags: (profileType: string, search?: string, selectedTags?: string[]) => Video[];
  getFavoriteVideos: (profileType: string) => Video[];
  getWatchingVideos: (profileType: string) => Video[];
  getAllTags: (profileType: string) => string[];
  
  fetchVideos: () => Promise<void>; 
  loadUserProfileData: (profileId: number) => Promise<void>;
  
  addVideo: (videoData: any) => Promise<void>; 
  updateVideo: (id: string, updates: Partial<Video>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

// --- HELPER DE MAPEAMENTO ---
const mapApiVideoToFrontVideo = (apiVideo: any): Video => {
    const participantesArray = apiVideo.participantes || [];
    let master = 'Não Definido';
    const participants: string[] = [];
    
    if (Array.isArray(participantesArray)) {
        participantesArray.forEach((participante: any) => {
            if (participante.e_mestre_participante === "1") {
                master = participante.nome_participante;
            } else {
                participants.push(participante.nome_participante);
            }
        });
    }
    
    const video: Video = {
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
        categories: apiVideo.tags ? apiVideo.tags.map((tag: any) => tag.nome_tag) : [],
    };

    if (apiVideo.progresso_segundos) {
        video.savedProgress = apiVideo.progresso_segundos;
    }

    return video;
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

// --- PROVIDER ---

export function VideoProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});

  // 1. Fetch Videos (Sem localStorage fallback de dados)
  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/videos');
      const apiVideos = response.data.videos; 
      const mappedVideos = apiVideos.map(mapApiVideoToFrontVideo);
      setVideos(mappedVideos);
    } catch (error) {
      console.error("Erro ao carregar vídeos:", error);
      toast({ 
        title: "Erro de Conexão", 
        description: "Não foi possível conectar ao servidor.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Load User Profile Data
  const loadUserProfileData = async (profileId: number) => {
    try {
        const favResponse = await api.get(`/videos/favoritos?fk_perfil=${profileId}`);
        const favIds = favResponse.data.data.map((v: any) => String(v.pk_video));
        setFavorites(favIds);

        const watchResponse = await api.get(`/videos/assistindo?fk_perfil=${profileId}`);
        const history: WatchProgress[] = watchResponse.data.videos.map((v: any) => ({
            videoId: String(v.pk_video),
            progress: v.progresso_segundos,
            lastWatched: v.ultimo_acesso
        }));
        setWatchProgress(history);
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
  };

  useEffect(() => {
    fetchVideos(); 
  }, []);

  // --- PLAYER LOGIC ---

  const startWatching = async (videoId: string): Promise<number> => {
    const currentProfileStr = localStorage.getItem('diceplay_current_profile');
    if (!currentProfileStr) return 0;
    const profileId = JSON.parse(currentProfileStr).id;

    try {
        const response = await api.post(`/videos/assistir/${videoId}`, { fk_perfil: profileId });
        return response.data.progresso_segundos || 0;
    } catch (error) {
        console.error("Erro ao iniciar sessão de vídeo:", error);
        return 0;
    }
  };

  const updateWatchProgress = (videoId: string, seconds: number, forceSave = false) => {
    // Atualiza estado local
    setWatchProgress(prev => {
      const existing = prev.findIndex(p => p.videoId === videoId);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], progress: seconds, lastWatched: new Date().toISOString() };
        return updated;
      }
      return [...prev, { videoId, progress: seconds, lastWatched: new Date().toISOString() }];
    });

    const currentProfileStr = localStorage.getItem('diceplay_current_profile');
    if (!currentProfileStr) return;
    const profileId = JSON.parse(currentProfileStr).id;

    const saveToBackend = async () => {
        try {
            await api.put(`/videos/progresso/${videoId}`, {
                fk_perfil: profileId,
                tempo_atual: seconds
            });
        } catch (error) {
            console.error("Erro ao salvar progresso:", error);
        }
    };

    if (forceSave) {
        if (saveTimeoutRef.current[videoId]) clearTimeout(saveTimeoutRef.current[videoId]);
        saveToBackend();
        return;
    }

    if (saveTimeoutRef.current[videoId]) clearTimeout(saveTimeoutRef.current[videoId]);
    
    saveTimeoutRef.current[videoId] = setTimeout(() => {
        saveToBackend();
    }, 5000); 
  };

  const getWatchProgress = (videoId: string): number => {
    const found = watchProgress.find(p => p.videoId === videoId);
    return found ? found.progress : 0;
  };

  const toggleFavorite = async (videoId: string) => {
    const currentProfileStr = localStorage.getItem('diceplay_current_profile');
    if (!currentProfileStr) {
        toast({ title: "Erro", description: "Selecione um perfil.", variant: "destructive" });
        return;
    }
    const profileId = JSON.parse(currentProfileStr).id;

    const isFav = favorites.includes(videoId);
    setFavorites(prev => isFav ? prev.filter(id => id !== videoId) : [...prev, videoId]);

    try {
        await api.post(`/videos/favoritar/${videoId}`, { fk_perfil: profileId });
    } catch (error) {
        setFavorites(prev => isFav ? [...prev, videoId] : prev.filter(id => id !== videoId));
    }
  };

  const isFavorite = (videoId: string) => favorites.includes(videoId);

  // --- FILTROS ---

  const getFilteredVideosByTags = (profileType: string, search?: string, selectedTags?: string[]): Video[] => {
    const maxRating = getMaxRatingForType(profileType);
    return videos.filter(video => {
      if (getRatingLevel(video.rating) > maxRating) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        if (!video.title.toLowerCase().includes(searchLower) &&
            !video.description.toLowerCase().includes(searchLower) &&
            !video.channelName.toLowerCase().includes(searchLower)) return false;
      }
      if (selectedTags && selectedTags.length > 0) {
         return selectedTags.some(tag => video.categories.includes(tag));
      }
      return true;
    });
  };
  
  const getFilteredVideos = (profileType: string, search?: string, category?: string) => {
      return getFilteredVideosByTags(profileType, search, category ? [category] : undefined);
  }

  const getFavoriteVideos = (profileType: string): Video[] => {
    return getFilteredVideos(profileType).filter(v => favorites.includes(v.id));
  };

  const getWatchingVideos = (profileType: string): Video[] => {
    const watchingIds = watchProgress
        .filter(p => p.progress > 5) 
        .map(p => p.videoId);
    return getFilteredVideos(profileType).filter(v => watchingIds.includes(v.id));
  };

  const getAllTags = (profileType: string): string[] => {
    const maxRating = getMaxRatingForType(profileType);
    const tagsSet = new Set<string>();
    videos.forEach(video => {
      if (getRatingLevel(video.rating) <= maxRating) {
        video.categories.forEach(cat => tagsSet.add(cat));
      }
    });
    return Array.from(tagsSet).sort();
  };

  // --- ADMIN ---
  const addVideo = async (payload: AddVideoData) => {
    const response = await api.post('/videos', payload);
    const newVideo = mapApiVideoToFrontVideo(response.data.video);
    setVideos(prev => [...prev, newVideo]);
    toast({ title: "Sucesso", description: "Vídeo adicionado." });
  };

  const updateVideo = async (id: string, updates: Partial<Video>) => {
    const payload: any = {
        link_video: updates.link,
        descricao_video: updates.description,
        classificacao_etaria_video: updates.rating,
        master: updates.master,
        participantes: updates.participants,
        tags: updates.categories,
    };
    await api.put(`/videos/${id}`, payload);
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    toast({ title: "Sucesso", description: "Vídeo atualizado." });
  };

  const deleteVideo = async (id: string) => {
    await api.delete(`/videos/${id}`);
    setVideos(prev => prev.filter(v => v.id !== id));
    toast({ title: "Sucesso", description: "Vídeo excluído." });
  };

  return (
    <VideoContext.Provider value={{
      videos, favorites, watchProgress, isLoading,
      toggleFavorite, isFavorite, 
      startWatching, // EXPORTANDO A NOVA FUNÇÃO
      updateWatchProgress, getWatchProgress,
      getFilteredVideos, getFilteredVideosByTags, getFavoriteVideos, getWatchingVideos, getAllTags,
      fetchVideos, loadUserProfileData,
      addVideo, updateVideo, deleteVideo
    }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideos() {
  const context = useContext(VideoContext);
  if (context === undefined) throw new Error('useVideos error');
  return context;
}