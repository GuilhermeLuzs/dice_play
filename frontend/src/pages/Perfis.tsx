import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Check, Loader2, Save } from 'lucide-react'; // Ícones corrigidos
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import avatarsData from '@/data/avatars.json';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import api from '@/services/api';

export default function Perfis() {
  const navigate = useNavigate();
  const { user, selectProfile, addProfile, updateProfile, deleteProfile, logout } = useAuth();
  const { toast } = useToast();
  
  // States de Perfil
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    avatar: avatarsData.avatars[0].url,
    birthDate: ''
  });

  // States de Edição de Usuário (Header)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  });

  // --- CORREÇÃO AQUI ---
  // Carrega dados do usuário para o modal quando ele abre
  useEffect(() => {
    if (user && isUserModalOpen) {
      // Pega apenas a parte da data (YYYY-MM-DD) da string ISO
      const rawDate = user.birth_date || '';
      const formattedDate = rawDate.split('T')[0];

      setEditUserData({
        name: user.name,
        email: user.email,
        birthDate: formattedDate, 
        password: '',
        confirmPassword: ''
      });
    }
  }, [user, isUserModalOpen]);

  if (!user) {
    navigate('/login');
    return null;
  }

  // --- O RESTANTE DO CÓDIGO PERMANECE IDÊNTICO AO ANTERIOR ---
  // (Mantendo o resto do arquivo igual para não poluir, 
  // já que a única lógica necessária era o tratamento da data acima)

  const handleSelectProfile = (profile: Profile) => {
    selectProfile(profile);
    navigate('/catalogo');
  };

  const handleCreateProfile = async () => {
    if (!newProfile.name || !newProfile.birthDate) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome e data de nascimento.", variant: "destructive" });
      return;
    }
    const success = await addProfile(newProfile.name, newProfile.avatar, newProfile.birthDate);
    if (success) {
      toast({ title: "Perfil criado!" });
      setIsCreating(false);
      setNewProfile({ name: '', avatar: avatarsData.avatars[0].url, birthDate: '' });
    } else {
      toast({ title: "Erro", description: "Limite atingido ou erro no servidor.", variant: "destructive" });
    }
  };

  const handleUpdateProfile = (profileId: string) => {
    const profiles = user.profiles || [];
    const profile = profiles.find(p => p.id === profileId || p.pk_perfil?.toString() === profileId);
    if (profile) {
      updateProfile(profileId, {
        name: newProfile.name || profile.name,
        avatar: newProfile.avatar || profile.avatar,
        birthDate: newProfile.birthDate || profile.birthDate
      });
      toast({ title: "Perfil atualizado!" });
    }
    setIsEditing(null);
    setNewProfile({ name: '', avatar: avatarsData.avatars[0].url, birthDate: '' });
  };

  const handleDeleteProfile = (profileId: string) => {
    deleteProfile(profileId);
    toast({ title: "Perfil removido." });
  };

  const startEditing = (profile: Profile) => {
    const id = profile.id || profile.pk_perfil?.toString() || '';
    setIsEditing(id);
    setNewProfile({ name: profile.name, avatar: profile.avatar, birthDate: profile.birthDate });
  };

  const handleUpdateUser = async () => {
    if (!editUserData.name || !editUserData.email || !editUserData.birthDate) {
      toast({ title: "Erro", description: "Nome, Email e Data de nascimento são obrigatórios.", variant: "destructive" });
      return;
    }

    if (editUserData.password && editUserData.password !== editUserData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
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

      toast({ title: "Sucesso", description: "Seus dados foram atualizados." });
      setIsUserModalOpen(false);
      window.location.reload(); 
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Erro ao atualizar", 
        description: error.response?.data?.message || "Verifique os dados e tente novamente.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoadingUser(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'infantil': return '👶 Infantil';
      case 'juvenil': return '🧒 Juvenil';
      case 'adulto': return '🧑 Adulto';
      default: return type;
    }
  };

  const safeProfiles = user.profiles || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40">
        <Logo size="md" />
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 bg-secondary/50 p-1.5 pr-4 rounded-full border border-border/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
              <span className="font-display font-bold text-primary text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium hidden sm:inline-block max-w-[100px] truncate">
              {user.name}
            </span>
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="ml-1 p-1.5 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-primary"
              title="Editar dados da conta"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 border-l pl-4 border-border/50">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <h1 className="font-display text-2xl sm:text-4xl mb-2 text-center">Quem está assistindo?</h1>
        <p className="text-muted-foreground mb-8 sm:mb-12 text-center">Selecione um perfil para continuar</p>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
          {safeProfiles.map((profile, index) => {
            const profileId = profile.id || profile.pk_perfil?.toString() || `temp-${index}`;

            return (
              <div key={profileId} className="group relative">
                {isEditing === profileId ? (
                  <div className="w-40 p-4 bg-card rounded-xl border border-border space-y-4 animate-scale-in">
                    <div className="grid grid-cols-4 gap-2">
                      {avatarsData.avatars.slice(0, 8).map(avatar => (
                        <button
                          key={avatar.id}
                          onClick={() => setNewProfile({ ...newProfile, avatar: avatar.url })}
                          className={cn(
                            "w-8 h-8 rounded-full overflow-hidden border-2 transition-all",
                            newProfile.avatar === avatar.url ? "border-primary" : "border-transparent"
                          )}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Nome"
                      value={newProfile.name}
                      onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="date"
                      value={newProfile.birthDate}
                      onChange={e => setNewProfile({ ...newProfile, birthDate: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateProfile(profileId)} className="flex-1 h-8">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(null)} className="flex-1 h-8">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectProfile(profile)}
                    className="w-40 flex flex-col items-center gap-3 group"
                  >
                    <div className="relative">
                      <img 
                        src={profile.avatar || avatarsData.avatars[0].url}
                        alt={profile.name}
                        className="w-32 h-32 rounded-xl object-cover border-4 border-transparent group-hover:border-primary transition-all"
                      />
                      <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                      
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(profile); }}
                          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profileId); }}
                          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{profile.name}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(profile.type)}</p>
                    </div>
                  </button>
                )}
              </div>
            );
          })}

          {safeProfiles.length < 5 && (
            isCreating ? (
              <div className="w-40 p-4 bg-card rounded-xl border border-border space-y-4 animate-scale-in">
                 <div className="grid grid-cols-4 gap-2">
                      {avatarsData.avatars.slice(0, 8).map(avatar => (
                        <button
                          key={avatar.id}
                          onClick={() => setNewProfile({ ...newProfile, avatar: avatar.url })}
                          className={cn(
                            "w-8 h-8 rounded-full overflow-hidden border-2 transition-all",
                            newProfile.avatar === avatar.url ? "border-primary" : "border-transparent"
                          )}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Nome"
                      value={newProfile.name}
                      onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="date"
                      value={newProfile.birthDate}
                      onChange={e => setNewProfile({ ...newProfile, birthDate: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateProfile} className="flex-1 h-8">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsCreating(false)} className="flex-1 h-8">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-40 flex flex-col items-center gap-3 group"
              >
                <div className="w-32 h-32 rounded-xl border-4 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary transition-colors">
                  <Plus className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Adicionar Perfil
                </p>
              </button>
            )
          )}
        </div>
      </main>

      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Meus Dados</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input 
                value={editUserData.name} 
                onChange={e => setEditUserData({...editUserData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={editUserData.email} 
                onChange={e => setEditUserData({...editUserData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input 
                type="date" 
                value={editUserData.birthDate} 
                onChange={e => setEditUserData({...editUserData, birthDate: e.target.value})}
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Alterar Senha</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input 
                    type="password" 
                    placeholder="Deixe em branco para manter"
                    value={editUserData.password}
                    onChange={e => setEditUserData({...editUserData, password: e.target.value})}
                  />
                </div>
                {editUserData.password && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input 
                        type="password" 
                        placeholder="Repita a nova senha"
                        value={editUserData.confirmPassword}
                        onChange={e => setEditUserData({...editUserData, confirmPassword: e.target.value})}
                    />
                    </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)} disabled={isLoadingUser}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={isLoadingUser}>
              {isLoadingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}