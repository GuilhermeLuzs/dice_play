import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

// Interface para o Perfil
export interface Profile {
  pk_perfil?: number;
  id?: string; // Mantido para compatibilidade com código antigo
  name: string;
  avatar: string;
  birthDate: string;
  type: 'infantil' | 'juvenil' | 'adulto';
}

// Interface para o Usuário
export interface User {
  id: number;
  name: string;
  email: string;
  birth_date: string;
  account_status: '0' | '1';
  is_admin: '0' | '1';
  profiles?: Profile[]; // O frontend usa 'profiles'
  perfis?: Profile[];   // O backend manda 'perfis'
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
  addProfile: (name: string, avatar: string, birthDate: string) => Promise<boolean>;
  updateProfile: (profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (profileId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getUserType(birthDate: string): 'infantil' | 'juvenil' | 'adulto' {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) {
    age--;
  }
  if (age < 12) return 'infantil';
  if (age < 18) return 'juvenil';
  return 'adulto';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. VERIFICAÇÃO INICIAL (Carregar Token) ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('diceplay_token');
      
      if (token) {
        try {
          const response = await api.get('/me');
          const backendUser = response.data;

          // CORREÇÃO: Mapeia 'perfis' do backend para 'profiles' do frontend
          // Se vier nulo, define como array vazio []
          const formattedUser: User = {
            ...backendUser,
            profiles: backendUser.perfis || [] 
          };

          setUser(formattedUser);
          
          const storedProfile = localStorage.getItem('diceplay_current_profile');
          if (storedProfile) {
            setCurrentProfile(JSON.parse(storedProfile));
          }
        } catch (error) {
          console.error("Sessão expirada ou inválida");
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
      
      // CORREÇÃO: Mapeia perfis -> profiles e garante array
      const userData: User = {
        ...backendUser,
        profiles: backendUser.perfis || []
      };
      
      localStorage.setItem('diceplay_token', access_token);
      setUser(userData);
      
      return true;
    } catch (error: any) {
      if (error.response?.status === 403) {
        return 'blocked';
      }
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
      
      // CORREÇÃO: Usuário novo tem lista vazia
      const userData: User = {
        ...backendUser,
        profiles: [] 
      };
      
      localStorage.setItem('diceplay_token', access_token);
      setUser(userData);
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
        await api.post('/logout');
    } catch (e) {
        // Ignora erro
    }
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

  // --- Mocks para Perfil (Ajustar quando criar backend de perfis) ---
  const addProfile = async (name: string, avatar: string, birthDate: string) => {
    if (!user) return false;
    // Simulação visual: Adiciona localmente
    const newProfile: any = { 
        id: Date.now().toString(), 
        name, 
        avatar, 
        birthDate, 
        type: getUserType(birthDate) 
    };
    
    // Atualiza estado garantindo que profiles existe
    const currentProfiles = user.profiles || [];
    const updatedUser = { ...user, profiles: [...currentProfiles, newProfile] };
    
    setUser(updatedUser);
    return true;
  };

  const updateProfile = (profileId: string, updates: Partial<Profile>) => {};
  const deleteProfile = (profileId: string) => {};

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
      clearCurrentProfile,
      addProfile,
      updateProfile,
      deleteProfile
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