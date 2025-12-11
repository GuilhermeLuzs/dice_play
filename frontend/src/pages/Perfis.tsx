import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { usePerfis } from '@/contexts/PerfilContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import api from '@/services/api';

export default function Perfis() {
  const navigate = useNavigate();
  const { user, selectProfile, logout } = useAuth();
  
  const { 
    perfis, 
    avatares, 
    fetchPerfis, 
    criarPerfil, 
    editarPerfil, 
    deletarPerfil,
    mapPerfisToProfiles,
    isLoading: isLoadingPerfis 
  } = usePerfis();

  const { toast } = useToast();
  
  // Converte os perfis da API para o formato do Front
  const frontendProfiles = mapPerfisToProfiles(perfis);

  // --- States de Controle do Modal de Perfil ---
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null); // Se null, é criação. Se number, é edição.
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: '',
    fk_avatar: 0,
    selectedAvatarUrl: '', 
    birthDate: ''
  });

  // Atualiza lista ao carregar a página
  useEffect(() => {
    fetchPerfis();
  }, []);

  // Define um avatar padrão se estiver criando um novo e a lista carregou
  useEffect(() => {
    if (avatares.length > 0 && formData.fk_avatar === 0 && !editingProfileId) {
      setFormData(prev => ({
        ...prev,
        fk_avatar: avatares[0].pk_avatar,
        selectedAvatarUrl: avatares[0].img_avatar // Mantido img_avatar
      }));
    }
  }, [avatares, isProfileModalOpen]); 

  // --- Lógica de Edição de Usuário (Header) ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: '', email: '', birthDate: '', password: '', confirmPassword: ''
  });

  useEffect(() => {
    if (user && isUserModalOpen) {
      setEditUserData({
        name: user.name,
        email: user.email,
        birthDate: user.birth_date ? user.birth_date.split('T')[0] : '', 
        password: '',
        confirmPassword: ''
      });
    }
  }, [user, isUserModalOpen]);

  if (!user) {
    navigate('/login');
    return null;
  }

  // --- Funções de Perfil ---

  const handleSelectProfile = (profile: Profile) => {
    selectProfile(profile);
    navigate('/catalogo');
  };

  // Abre o modal em modo de CRIAÇÃO
  const openCreateModal = () => {
    setEditingProfileId(null);
    resetForm();
    setIsProfileModalOpen(true);
  };

  // Abre o modal em modo de EDIÇÃO
  const openEditModal = (profile: Profile) => {
    setEditingProfileId(Number(profile.id));
    
    // Tenta achar o ID pelo FK ou pela URL
    let avatarId = profile.fk_avatar || 0;
    if (!avatarId && profile.avatar) {
        // Mantido img_avatar na busca
        const found = avatares.find(a => a.img_avatar === profile.avatar);
        if (found) avatarId = found.pk_avatar;
    }

    setFormData({
      name: profile.name,
      fk_avatar: avatarId,
      selectedAvatarUrl: profile.avatar,
      birthDate: profile.birthDate.split('T')[0]
    });
    
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.birthDate) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome e data de nascimento.", variant: "destructive" });
      return;
    }

    setIsSavingProfile(true);

    try {
        if (editingProfileId) {
            // Edição
            await editarPerfil(editingProfileId, {
                nome_perfil: formData.name,
                fk_avatar: formData.fk_avatar,
                data_nascimento_perfil: formData.birthDate
            });
        } else {
            // Criação
            await criarPerfil({
                nome_perfil: formData.name,
                data_nascimento_perfil: formData.birthDate,
                fk_avatar: formData.fk_avatar
            });
        }
        setIsProfileModalOpen(false);
        resetForm();
    } catch (error) {
        // Erro já tratado no Context
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleDeleteProfile = async (pk_perfil: number) => {
    if (confirm("Tem certeza que deseja excluir este perfil?")) {
        await deletarPerfil(pk_perfil);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fk_avatar: avatares.length > 0 ? avatares[0].pk_avatar : 0,
      selectedAvatarUrl: avatares.length > 0 ? avatares[0].img_avatar : '', // Mantido img_avatar
      birthDate: ''
    });
  };

  const handleAvatarSelect = (avatar: any) => {
    setFormData(prev => ({
        ...prev,
        fk_avatar: avatar.pk_avatar,
        selectedAvatarUrl: avatar.img_avatar // Mantido img_avatar
    }));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'infantil': return '👶 Infantil';
      case 'juvenil': return '🧒 Juvenil';
      case 'adulto': return '🧑 Adulto';
      default: return type;
    }
  };

  const handleUpdateUser = async () => {
      if (!editUserData.name || !editUserData.email || !editUserData.birthDate) {
        toast({ title: "Erro", description: "Dados obrigatórios.", variant: "destructive" });
        return;
      }
      if (editUserData.password && editUserData.password !== editUserData.confirmPassword) {
        toast({ title: "Erro", description: "Senhas não conferem.", variant: "destructive" });
        return;
      }
      setIsLoadingUser(true);
      try {
        await api.put('/user/update', {
          name: editUserData.name,
          email: editUserData.email,
          birth_date: editUserData.birthDate,
          password: editUserData.password || undefined,
          password_confirmation: editUserData.confirmPassword
        });
        toast({ title: "Sucesso", description: "Dados atualizados." });
        setIsUserModalOpen(false);
        window.location.reload(); 
      } catch (error: any) {
        toast({ title: "Erro", description: error.response?.data?.message || "Falha ao atualizar.", variant: "destructive" });
      } finally {
        setIsLoadingUser(false);
      }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* --- HEADER --- */}
      <header className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40">
        <Logo size="md" />
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 bg-secondary/50 p-1.5 pr-4 rounded-full border border-border/50">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
               <span className="font-display font-bold text-primary text-sm">{user.name.charAt(0).toUpperCase()}</span>
             </div>
             <span className="text-sm font-medium hidden sm:inline-block max-w-[100px] truncate">{user.name}</span>
             <button onClick={() => setIsUserModalOpen(true)} className="ml-1 p-1.5 hover:bg-background rounded-full transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex items-center gap-2 border-l pl-4 border-border/50">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout}>Sair</Button>
          </div>
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <h1 className="font-display text-2xl sm:text-4xl mb-2 text-center">Quem está assistindo?</h1>
        <p className="text-muted-foreground mb-8 sm:mb-12 text-center">Selecione um perfil para continuar</p>

        {isLoadingPerfis ? (
             <Loader2 className="w-10 h-10 animate-spin text-primary" />
        ) : (
        <div className="flex flex-wrap justify-center gap-8 max-w-5xl"> 
          
          {/* LISTA DE PERFIS */}
          {frontendProfiles.map((profile) => (
              <div key={profile.id} className="group relative animate-scale-in">
                  <button onClick={() => handleSelectProfile(profile)} className="w-48 flex flex-col items-center gap-4 transition-transform hover:scale-105">
                    <div className="relative">
                      {/* Imagem do Perfil Maior */}
                      <img 
                        src={profile.avatar} 
                        alt={profile.name} 
                        className="w-40 h-40 rounded-xl object-cover border-4 border-transparent group-hover:border-primary shadow-lg transition-all" 
                      />
                      <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                      
                      {/* Botões de Ação */}
                      <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div 
                           onClick={(e) => { e.stopPropagation(); openEditModal(profile); }} 
                           className="cursor-pointer w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary shadow-sm"
                           title="Editar Perfil"
                        >
                           <Pencil className="w-4 h-4" />
                        </div>
                        <div 
                           onClick={(e) => { e.stopPropagation(); handleDeleteProfile(Number(profile.id)); }} 
                           className="cursor-pointer w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground shadow-sm"
                           title="Excluir Perfil"
                        >
                           <Trash2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-display text-lg font-medium tracking-wide">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">{getTypeLabel(profile.type)}</p>
                    </div>
                  </button>
              </div>
          ))}

          {/* BOTÃO DE ADICIONAR (Grande) */}
          {frontendProfiles.length < 5 && (
              <button 
                onClick={openCreateModal} 
                className="w-48 flex flex-col items-center gap-4 group transition-transform hover:scale-105"
              >
                <div className="w-40 h-40 rounded-xl border-4 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <Plus className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="font-medium text-lg text-muted-foreground group-hover:text-foreground">Adicionar Perfil</p>
              </button>
          )}
        </div>
        )}
      </main>
      
      {/* --- MODAL DE CRIAR/EDITAR PERFIL (LAYOUT MELHORADO + img_avatar) --- */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-2xl font-display">
                    {editingProfileId ? 'Editar Perfil' : 'Criar Novo Perfil'}
                </DialogTitle>
                <DialogDescription className="text-lg">
                    Escolha um avatar e personalize seu herói.
                </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 h-full">
                    
                    {/* Lado Esquerdo: Seleção de Avatar (MELHORADO) */}
                    <div className="space-y-4 flex flex-col h-full">
                        
                        <div className="flex-1 min-h-[350px] bg-secondary/30 rounded-2xl border border-border/50 p-6 overflow-y-auto custom-scrollbar shadow-inner">
                            {/* Grid Automático para bolinhas */}
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-6 justify-items-center">
                                {avatares.map(avatar => (
                                    <button
                                        key={avatar.pk_avatar}
                                        onClick={() => handleAvatarSelect(avatar)}
                                        className={cn(
                                            "relative group w-24 h-24 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50",
                                            formData.fk_avatar === avatar.pk_avatar 
                                                ? "ring-4 ring-primary ring-offset-4 ring-offset-background scale-110 shadow-xl z-10" 
                                                : "opacity-80 hover:opacity-100 hover:scale-110 hover:shadow-lg hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background"
                                        )}
                                    >
                                        <img 
                                            src={avatar.img_avatar} /* USANDO IMG_AVATAR */
                                            className="w-full h-full object-cover rounded-full bg-background" 
                                        />
                                        
                                        {formData.fk_avatar === avatar.pk_avatar && (
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200">
                                                <Check className="w-10 h-10 text-white drop-shadow-md stroke-[3]" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Lado Direito: Formulário */}
                    <div className="space-y-8 flex flex-col justify-start">
                        {/* Preview Grande */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-primary shadow-2xl ring-4 ring-primary/20">
                                 {formData.selectedAvatarUrl ? (
                                    <img src={formData.selectedAvatarUrl} className="w-full h-full object-cover transition-all duration-500 hover:scale-110" />
                                 ) : (
                                    <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">?</div>
                                 )}
                            </div>
                        </div>

                        <div className="space-y-6 px-2">
                            <div className="space-y-3">
                                <Label htmlFor="profileName" className="text-lg">Nome do Perfil</Label>
                                <Input 
                                    id="profileName"
                                    placeholder="Ex: Mestre dos Magos" 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    className="h-12 text-lg px-4"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="profileBirth" className="text-lg">Data de Nascimento</Label>
                                <Input 
                                    id="profileBirth"
                                    type="date" 
                                    value={formData.birthDate} 
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })} 
                                    className="h-12 px-4 text-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="p-6 pb-0 border-t border-border bg-background/50 backdrop-blur-sm z-10 gap-3 sm:gap-0">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base" onClick={() => setIsProfileModalOpen(false)}>Cancelar</Button>
                <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all" onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                        <>
                           <Loader2 className="w-5 h-5 mr-2 animate-spin"/>
                           Criando...
                        </>
                    ) : (
                        <>
                           <Save className="w-5 h-5 mr-2" />
                           {editingProfileId ? 'Salvar Alterações' : 'Criar Perfil'}
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE EDITAR USUÁRIO (HEADER) - ADICIONADO DE VOLTA --- */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader><DialogTitle>Editar Meus Dados</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2"><Label>Nome</Label><Input value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} /></div>
               <div className="space-y-2"><Label>Email</Label><Input type="email" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} /></div>
               <div className="space-y-2"><Label>Data de Nascimento</Label><Input type="date" value={editUserData.birthDate} onChange={e => setEditUserData({...editUserData, birthDate: e.target.value})} /></div>
               <div className="border-t pt-4"><h4 className="text-sm font-medium mb-3">Alterar Senha</h4>
                   <div className="space-y-2"><Label>Nova Senha</Label><Input type="password" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})} /></div>
                   {editUserData.password && <div className="space-y-2"><Label>Confirmar</Label><Input type="password" value={editUserData.confirmPassword} onChange={e => setEditUserData({...editUserData, confirmPassword: e.target.value})} /></div>}
               </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdateUser} disabled={isLoadingUser}>{isLoadingUser ? <Loader2 className="w-4 h-4 animate-spin"/> : "Salvar"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}