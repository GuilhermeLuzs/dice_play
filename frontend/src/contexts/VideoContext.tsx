import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import videosData from '@/data/videos.json';

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
}

interface WatchProgress {
  videoId: string;
  progress: number;
  lastWatched: string;
}

interface AddVideoData {
  link: string;
  rating: string;
  categories: string[];
  master?: string;
  participants?: string[];
  description?: string;
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
  addVideo: (video: AddVideoData) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  getAllTags: (profileType: string) => string[];
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

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

export function VideoProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>([]);

  useEffect(() => {
    const storedVideos = localStorage.getItem('diceplay_videos');
    if (storedVideos) {
      setVideos(JSON.parse(storedVideos));
    } else {
      setVideos(videosData.videos);
      localStorage.setItem('diceplay_videos', JSON.stringify(videosData.videos));
    }
    
    const storedFavorites = localStorage.getItem('diceplay_favorites');
    const storedProgress = localStorage.getItem('diceplay_watch_progress');
    
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    if (storedProgress) setWatchProgress(JSON.parse(storedProgress));
  }, []);

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

  const addVideo = (videoData: AddVideoData) => {
    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Novo Vídeo ${videos.length + 1}`,
      description: videoData.description || 'Descrição do vídeo adicionado pelo administrador.',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=450&fit=crop',
      link: videoData.link,
      publishedAt: new Date().toISOString().split('T')[0],
      channelName: 'Canal Adicionado',
      channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      categories: videoData.categories,
      duration: '0:00:00',
      rating: videoData.rating,
      views: 0,
      participants: videoData.participants || [],
      master: videoData.master || 'Não definido'
    };
    
    setVideos(prev => {
      const updated = [...prev, newVideo];
      localStorage.setItem('diceplay_videos', JSON.stringify(updated));
      return updated;
    });
  };

  const updateVideo = (id: string, updates: Partial<Video>) => {
    setVideos(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, ...updates } : v);
      localStorage.setItem('diceplay_videos', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => {
      const updated = prev.filter(v => v.id !== id);
      localStorage.setItem('diceplay_videos', JSON.stringify(updated));
      return updated;
    });
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
