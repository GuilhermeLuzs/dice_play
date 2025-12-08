import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

// --- Interfaces ---
export interface Avatar {
  pk_avatar: number;
  nome_avatar: string;
  url_avatar: string;
  descricao_avatar?: string;
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

// Formato para criação/edição
export interface PerfilFormData {
  nome_perfil: string;
  data_nascimento_perfil: string;
  fk_avatar: number;
}

// Mapeado para o frontend (camelCase)
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
  // Dados
  avatares: Avatar[];
  perfis: Perfil[];
  isLoading: boolean;
  
  // Funções
  fetchAvatares: () => Promise<void>;
  fetchPerfis: () => Promise<void>;
  criarPerfil: (data: PerfilFormData) => Promise<Perfil | null>;
  editarPerfil: (id: number, data: Partial<PerfilFormData>) => Promise<Perfil | null>;
  deletarPerfil: (id: number) => Promise<boolean>;
  
  // Utilitários
  mapPerfilToProfile: (perfil: Perfil) => Profile;
  mapPerfisToProfiles: (perfis: Perfil[]) => Profile[];
  getAvailableAvatars: () => Avatar[];
}

const PerfilContext = createContext<PerfilContextType | undefined>(undefined);

// --- Provider ---
export function PerfilProvider({ children }: { children: ReactNode }) {
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Função para mapear Perfil (API) para Profile (Frontend)
  const mapPerfilToProfile = (perfil: Perfil): Profile => {
    const idade = calcularIdade(perfil.data_nascimento_perfil);
    let tipo = 'adulto';
    
    if (idade < 12) tipo = 'infantil';
    else if (idade < 18) tipo = 'juvenil';
    
    return {
      id: perfil.pk_perfil.toString(),
      name: perfil.nome_perfil,
      birthDate: perfil.data_nascimento_perfil,
      avatar: perfil.avatar?.url_avatar || '',
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
      setIsLoading(true);
      const response = await api.get('/avatar');
      setAvatares(response.data.avatares || []);
    } catch (error: any) {
      console.error('Erro ao buscar avatares:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os avatares.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPerfis = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/perfil');
      setPerfis(response.data.perfis || []);
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os perfis.',
        variant: 'destructive'
      });
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
      
      toast({
        title: 'Sucesso!',
        description: 'Perfil criado com sucesso.',
      });
      
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
      setPerfis(prev => prev.map(p => 
        p.pk_perfil === id ? perfilAtualizado : p
      ));
      
      toast({
        title: 'Sucesso!',
        description: 'Perfil atualizado com sucesso.',
      });
      
      return perfilAtualizado;
    } catch (error: any) {
      console.error('Erro ao editar perfil:', error);
      
      const errorMessage = error.response?.data?.message || 'Erro ao editar perfil';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      
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
      
      toast({
        title: 'Sucesso!',
        description: 'Perfil excluído com sucesso.',
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar perfil:', error);
      
      const errorMessage = error.response?.data?.message || 'Erro ao excluir perfil';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableAvatars = (): Avatar[] => {
    return avatares;
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchAvatares();
    fetchPerfis();
  }, []);

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

// --- Hook ---
export function usePerfis() {
  const context = useContext(PerfilContext);
  if (context === undefined) {
    throw new Error('usePerfis deve ser usado dentro de um PerfilProvider');
  }
  return context;
}