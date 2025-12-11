import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Pencil, Check, X, LogOut, Users } from 'lucide-react';
import { CatalogSidebar } from '@/components/CatalogSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfis } from '@/contexts/PerfilContext'; 
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PerfilConfig() {
  const navigate = useNavigate();
  const { currentProfile, user, logout, clearCurrentProfile, selectProfile } = useAuth();
  const { editarPerfil, avatares, fetchPerfis, mapPerfilToProfile } = usePerfis();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // 1. Estado da Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State com fk_avatar (ID)
  const [editData, setEditData] = useState({
    name: '',
    fk_avatar: 0,
    avatarUrl: '', // Apenas visual
    birthDate: ''
  });

  useEffect(() => {
    // Carrega dados iniciais do currentProfile
    if (currentProfile) {
        setEditData({
            name: currentProfile.name,
            fk_avatar: currentProfile.fk_avatar || 0, 
            avatarUrl: currentProfile.avatar,
            birthDate: currentProfile.birthDate ? currentProfile.birthDate.split('T')[0] : ''
        });
        if (!currentProfile.fk_avatar) {
             fetchPerfis(); 
        }
    }
  }, [currentProfile]);

  useEffect(() => {
     if (editData.fk_avatar === 0 && avatares.length > 0 && editData.avatarUrl) {
         const found = avatares.find(a => a.img_avatar === editData.avatarUrl);
         if (found) setEditData(prev => ({ ...prev, fk_avatar: found.pk_avatar }));
     }
  }, [avatares, editData.avatarUrl]);

  if (!user || !currentProfile) {
    navigate('/login');
    return null;
  }

  const handleSave = async () => {
    if (!editData.name) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    const perfilAtualizado = await editarPerfil(Number(currentProfile.id), {
        nome_perfil: editData.name,
        fk_avatar: editData.fk_avatar,
        data_nascimento_perfil: editData.birthDate
    });

    if (perfilAtualizado) {
        const profileMapped = mapPerfilToProfile(perfilAtualizado);
        selectProfile(profileMapped);
        setIsEditing(false);
    }
  };

  const handleAvatarSelect = (avatar: any) => {
    setEditData(prev => ({
        ...prev,
        fk_avatar: avatar.pk_avatar,
        avatarUrl: avatar.img_avatar
    }));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'infantil': return 'Infantil (0-11 anos)';
      case 'juvenil': return 'Juvenil (12-17 anos)';
      case 'adulto': return 'Adulto (18+ anos)';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 2. Passar controle */}
      <CatalogSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      {/* 3. Ajuste Dinâmico */}
      <main className={cn(
        "pt-16 lg:pt-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border p-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <div><h1 className="font-display text-3xl">Meu Perfil</h1></div>
          </div>
        </header>

        <div className="p-6 max-w-2xl">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-3">
                  <Label>Avatar</Label>
                  <div className="grid grid-cols-6 gap-3">
                    {avatares.map(avatar => (
                      <button
                        key={avatar.pk_avatar}
                        onClick={() => handleAvatarSelect(avatar)}
                        className={cn(
                          "w-full aspect-square rounded-lg overflow-hidden border-4 transition-all",
                          editData.fk_avatar === avatar.pk_avatar ? "border-primary" : "border-transparent hover:border-muted"
                        )}
                      >
                        <img src={avatar.img_avatar} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Perfil</Label>
                  <Input id="name" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input id="birthDate" type="date" value={editData.birthDate} onChange={e => setEditData({ ...editData, birthDate: e.target.value })} />
                  <p className="text-xs text-muted-foreground">Isso define a classificação etária.</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="flex-1"><Check className="w-4 h-4 mr-2" /> Salvar</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1"><X className="w-4 h-4 mr-2" /> Cancelar</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  <img src={currentProfile.avatar} alt={currentProfile.name} className="w-24 h-24 rounded-xl object-cover border-4 border-primary" />
                  <div>
                    <h2 className="font-display text-2xl">{currentProfile.name}</h2>
                    <p className="text-muted-foreground">{getTypeLabel(currentProfile.type)}</p>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-border">
                    <div><Label className="text-muted-foreground">Data de Nascimento</Label><p className="font-medium">{new Date(currentProfile.birthDate).toLocaleDateString('pt-BR')}</p></div>
                    <div><Label className="text-muted-foreground">Conta Principal</Label><p className="font-medium">{user.email}</p></div>
                </div>
                <div className="space-y-3 pt-4 border-t border-border">
                  <Button onClick={() => setIsEditing(true)} className="w-full"><Pencil className="w-4 h-4 mr-2" /> Editar Perfil</Button>
                  <Button variant="outline" onClick={() => { clearCurrentProfile(); navigate('/perfis'); }} className="w-full"><Users className="w-4 h-4 mr-2" /> Trocar Perfil</Button>
                  <Button variant="outline" onClick={() => { logout(); navigate('/'); }} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"><LogOut className="w-4 h-4 mr-2" /> Sair da Conta</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}