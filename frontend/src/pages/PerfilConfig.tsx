import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Pencil, Check, X, LogOut, Users } from 'lucide-react';
import { CatalogSidebar } from '@/components/CatalogSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import avatarsData from '@/data/avatars.json';

export default function PerfilConfig() {
  const navigate = useNavigate();
  const { currentProfile, user, updateProfile, logout, clearCurrentProfile } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: currentProfile?.name || '',
    avatar: currentProfile?.avatar || '',
    birthDate: currentProfile?.birthDate || ''
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!currentProfile) {
    navigate('/perfis');
    return null;
  }

  const handleSave = () => {
    if (!editData.name) {
      toast({
        title: "Nome obrigatório",
        description: "O perfil precisa de um nome.",
        variant: "destructive"
      });
      return;
    }

    updateProfile(currentProfile.id, editData);
    toast({ title: "Perfil atualizado!" });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchProfile = () => {
    clearCurrentProfile();
    navigate('/perfis');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'infantil': return 'Infantil (0-11 anos)';
      case 'juvenil': return 'Juvenil (12-17 anos)';
      case 'adulto': return 'Adulto (18+ anos)';
      default: return type;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'infantil': return 'Acesso a conteúdo classificado como Livre';
      case 'juvenil': return 'Acesso a conteúdo classificado até 14 anos';
      case 'adulto': return 'Acesso completo a todo o catálogo';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CatalogSidebar />
      
      <main className="pt-16 lg:pt-0 lg:ml-20 xl:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border p-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-display text-3xl">Meu Perfil</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas informações</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-2xl">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            {isEditing ? (
              <>
                {/* Avatar Selection */}
                <div className="space-y-3">
                  <Label>Avatar</Label>
                  <div className="grid grid-cols-6 gap-3">
                    {avatarsData.avatars.map(avatar => (
                      <button
                        key={avatar.id}
                        onClick={() => setEditData({ ...editData, avatar: avatar.url })}
                        className={cn(
                          "w-full aspect-square rounded-lg overflow-hidden border-4 transition-all",
                          editData.avatar === avatar.url ? "border-primary" : "border-transparent hover:border-muted"
                        )}
                      >
                        <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Perfil</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={editData.birthDate}
                    onChange={e => setEditData({ ...editData, birthDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    A data de nascimento determina a classificação etária do conteúdo disponível.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Profile Display */}
                <div className="flex items-center gap-6">
                  <img 
                    src={currentProfile.avatar}
                    alt={currentProfile.name}
                    className="w-24 h-24 rounded-xl object-cover border-4 border-primary"
                  />
                  <div>
                    <h2 className="font-display text-2xl">{currentProfile.name}</h2>
                    <p className="text-muted-foreground">{getTypeLabel(currentProfile.type)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{getTypeDescription(currentProfile.type)}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <Label className="text-muted-foreground">Data de Nascimento</Label>
                    <p className="font-medium">
                      {new Date(currentProfile.birthDate).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Conta</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                  
                  <Button variant="outline" onClick={handleSwitchProfile} className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Trocar Perfil
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
