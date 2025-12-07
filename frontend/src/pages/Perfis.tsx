import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import avatarsData from '@/data/avatars.json';

export default function Perfis() {
  const navigate = useNavigate();
  const { user, selectProfile, addProfile, updateProfile, deleteProfile, logout } = useAuth();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    avatar: avatarsData.avatars[0].url,
    birthDate: ''
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSelectProfile = (profile: Profile) => {
    selectProfile(profile);
    navigate('/catalogo');
  };

  const handleCreateProfile = async () => {
    if (!newProfile.name || !newProfile.birthDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e data de nascimento.",
        variant: "destructive"
      });
      return;
    }

    // Nota: Como addProfile agora é async, podemos aguardar
    const success = await addProfile(newProfile.name, newProfile.avatar, newProfile.birthDate);
    
    if (success) {
      toast({ title: "Perfil criado!", description: `${newProfile.name} foi adicionado.` });
      setIsCreating(false);
      setNewProfile({ name: '', avatar: avatarsData.avatars[0].url, birthDate: '' });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível criar o perfil.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = (profileId: string) => {
    // Blindagem: Garante que profiles existe
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
    // Garante ID como string caso venha número do banco
    const id = profile.id || profile.pk_perfil?.toString() || '';
    setIsEditing(id);
    setNewProfile({
      name: profile.name,
      avatar: profile.avatar,
      birthDate: profile.birthDate
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'infantil': return '👶 Infantil';
      case 'juvenil': return '🧒 Juvenil';
      case 'adulto': return '🧑 Adulto';
      default: return type;
    }
  };

  // Garante lista segura para renderizar
  const safeProfiles = user.profiles || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" onClick={logout}>Sair</Button>
        </div>
      </header>

      {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <h1 className="font-display text-2xl sm:text-4xl mb-2 text-center">Quem está assistindo?</h1>
        <p className="text-muted-foreground mb-8 sm:mb-12 text-center">Selecione um perfil para continuar</p>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
          
          {/* AQUI ESTAVA O ERRO: Adicionado || [] no map e verificação de undefined */}
          {safeProfiles.map((profile, index) => {
            // Fallback para ID se vier do banco como pk_perfil
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
                    />
                    <Input
                      type="date"
                      value={newProfile.birthDate}
                      onChange={e => setNewProfile({ ...newProfile, birthDate: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateProfile(profileId)} className="flex-1">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(null)} className="flex-1">
                        <X className="w-4 h-4" />
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
                        src={profile.avatar || avatarsData.avatars[0].url} // Fallback avatar
                        alt={profile.name}
                        className="w-32 h-32 rounded-xl object-cover border-4 border-transparent group-hover:border-primary transition-all"
                      />
                      <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                      
                      {/* Edit/Delete buttons */}
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(profile); }}
                          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profileId); }}
                          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
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

          {/* Add Profile Button */}
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
                <div className="space-y-2">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    placeholder="Nome do perfil"
                    value={newProfile.name}
                    onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={newProfile.birthDate}
                    onChange={e => setNewProfile({ ...newProfile, birthDate: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateProfile} className="flex-1">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                    <X className="w-4 h-4" />
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
    </div>
  );
}