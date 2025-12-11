import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

// Interface para o Perfil (Frontend)
export interface Profile {
  id: string; 
  pk_perfil?: number;
  name: string;
  avatar: string;
  birthDate: string;
  type: string;
  fk_avatar?: number;
  fk_tipo_perfil?: number;
}

// Interface para o Usuário
export interface User {
  id: number;
  name: string;
  email: string;
  birth_date: string;
  account_status: '0' | '1';
  is_admin: '0' | '1';
}

interface AuthContextType {
  user: User | null;
  currentProfile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean | 'blocked'>;
  register: (name: string, email: string, password: string, birthDate: string) => Promise<boolean>;
  logout: () => void;
  selectProfile: (profile: Profile) => void;
  clearCurrentProfile: () => void;
  // MÉTODOS CRUD REMOVIDOS DAQUI - AGORA FICAM NO usePerfis()
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. VERIFICAÇÃO INICIAL ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('diceplay_token');
      
      if (token) {
        try {
          const response = await api.get('/me');
          setUser(response.data); // Salva dados do usuário
          
          const storedProfile = localStorage.getItem('diceplay_current_profile');
          if (storedProfile) {
            setCurrentProfile(JSON.parse(storedProfile));
          }
        } catch (error) {
          console.error("Sessão expirada");
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // --- 2. LOGIN ---
  const login = async (email: string, password: string): Promise<boolean | 'blocked'> => {
    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user: backendUser } = response.data;
      
      localStorage.setItem('diceplay_token', access_token);
      setUser(backendUser);
      return true;
    } catch (error: any) {
      if (error.response?.status === 403) return 'blocked';
      return false;
    }
  };

  // --- 3. REGISTRO ---
  const register = async (name: string, email: string, password: string, birthDate: string): Promise<boolean> => {
    try {
      const response = await api.post('/register', {
        name,
        email,
        password,
        birth_date: birthDate
      });
      const { access_token, user: backendUser } = response.data;
      
      localStorage.setItem('diceplay_token', access_token);
      setUser(backendUser);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try { await api.post('/logout'); } catch (e) {}
    localStorage.removeItem('diceplay_token');
    localStorage.removeItem('diceplay_current_profile');
    setUser(null);
    setCurrentProfile(null);
  };

  const selectProfile = (profile: Profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('diceplay_current_profile', JSON.stringify(profile));
  };

  const clearCurrentProfile = () => {
    setCurrentProfile(null);
    localStorage.removeItem('diceplay_current_profile');
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentProfile,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      selectProfile,
      clearCurrentProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}