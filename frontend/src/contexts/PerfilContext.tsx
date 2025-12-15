import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext'; // 1. IMPORTAR O CONTEXTO DE AUTH

// --- Interfaces (MANTÉM IGUAL) ---
export interface Avatar {
  pk_avatar: number;
  img_avatar: string;
  created_at?: string;
  updated_at?: string;
}

export interface Perfil {
  pk_perfil: number;
  nome_perfil: string;
  data_nascimento_perfil: string;
  fk_avatar: number;
  fk_user: number;
  fk_tipo_perfil: number;
  created_at: string;
  updated_at: string;
  avatar?: Avatar;
  tipo_perfil?: {
    pk_tipo_perfil: number;
    nome_tipo_perfil: string;
    faixa_etaria_tipo_perfil: string;
  };
}

export interface PerfilFormData {
  nome_perfil: string;
  data_nascimento_perfil: string;
  fk_avatar: number;
}

export interface Profile {
  id: string;
  name: string;
  birthDate: string;
  avatar: string;
  type: string;
  fk_avatar: number;
  fk_tipo_perfil: number;
}

interface PerfilContextType {
  avatares: Avatar[];
  perfis: Perfil[];
  isLoading: boolean;
  fetchAvatares: () => Promise<void>;
  fetchPerfis: () => Promise<void>;
  criarPerfil: (data: PerfilFormData) => Promise<Perfil | null>;
  editarPerfil: (id: number, data: Partial<PerfilFormData>) => Promise<Perfil | null>;
  deletarPerfil: (id: number) => Promise<boolean>;
  mapPerfilToProfile: (perfil: Perfil) => Profile;
  mapPerfisToProfiles: (perfis: Perfil[]) => Profile[];
  getAvailableAvatars: () => Avatar[];
}

const PerfilContext = createContext<PerfilContextType | undefined>(undefined);

// --- Provider ---
export function PerfilProvider({ children }: { children: ReactNode }) {
  // 2. PEGAR O ESTADO DE AUTENTICAÇÃO
  const { isAuthenticated } = useAuth(); 

  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const mapPerfilToProfile = (perfil: Perfil): Profile => {
    const idade = calcularIdade(perfil.data_nascimento_perfil);
    let tipo = 'adulto';
    if (idade < 12) tipo = 'infantil';
    else if (idade < 18) tipo = 'juvenil';
    
    return {
      id: perfil.pk_perfil.toString(),
      name: perfil.nome_perfil,
      birthDate: perfil.data_nascimento_perfil,
      avatar: perfil.avatar?.img_avatar || '',
      type: tipo,
      fk_avatar: perfil.fk_avatar,
      fk_tipo_perfil: perfil.fk_tipo_perfil
    };
  };

  const mapPerfisToProfiles = (perfis: Perfil[]): Profile[] => {
    return perfis.map(mapPerfilToProfile);
  };

  const calcularIdade = (dataNascimento: string): number => {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  // --- Funções da API ---
  
  const fetchAvatares = async () => {
    try {
      // setIsLoading(true); // Opcional: pode remover o loading global para não piscar a tela
      const response = await api.get('/avatar');
      setAvatares(response.data.avatares || []);
    } catch (error: any) {
      console.error('Erro ao buscar avatares:', error);
      // Removemos o toast de erro aqui para não incomodar se a sessão cair
    } finally {
      // setIsLoading(false);
    }
  };

  const fetchPerfis = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/perfil');
      setPerfis(response.data.perfis || []);
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const criarPerfil = async (data: PerfilFormData): Promise<Perfil | null> => {
    try {
      setIsLoading(true);
      const response = await api.post('/perfil', data);
      const novoPerfil = response.data.perfil;
      setPerfis(prev => [...prev, novoPerfil]);
      toast({ title: 'Sucesso!', description: 'Perfil criado com sucesso.' });
      return novoPerfil;
    } catch (error: any) {
      console.error('Erro ao criar perfil:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar perfil';
      const isLimitError = error.response?.status === 403;
      toast({
        title: isLimitError ? 'Limite atingido' : 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const editarPerfil = async (id: number, data: Partial<PerfilFormData>): Promise<Perfil | null> => {
    try {
      setIsLoading(true);
      const response = await api.put(`/perfil/${id}`, data);
      const perfilAtualizado = response.data.perfil;
      setPerfis(prev => prev.map(p => p.pk_perfil === id ? perfilAtualizado : p));
      toast({ title: 'Sucesso!', description: 'Perfil atualizado com sucesso.' });
      return perfilAtualizado;
    } catch (error: any) {
      console.error('Erro ao editar perfil:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao editar perfil';
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deletarPerfil = async (id: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      await api.delete(`/perfil/${id}`);
      setPerfis(prev => prev.filter(p => p.pk_perfil !== id));
      toast({ title: 'Sucesso!', description: 'Perfil excluído com sucesso.' });
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar perfil:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao excluir perfil';
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableAvatars = (): Avatar[] => {
    return avatares;
  };

  // 3. EFEITO CORRIGIDO: Só busca dados se estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
        fetchAvatares();
        fetchPerfis();
    } else {
        // Se deslogar, limpa os dados da memória
        setAvatares([]);
        setPerfis([]);
    }
  }, [isAuthenticated]); // Dependência: isAuthenticated

  return (
    <PerfilContext.Provider value={{
      avatares,
      perfis,
      isLoading,
      fetchAvatares,
      fetchPerfis,
      criarPerfil,
      editarPerfil,
      deletarPerfil,
      mapPerfilToProfile,
      mapPerfisToProfiles,
      getAvailableAvatars
    }}>
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfis() {
  const context = useContext(PerfilContext);
  if (context === undefined) {
    throw new Error('usePerfis deve ser usado dentro de um PerfilProvider');
  }
  return context;
}