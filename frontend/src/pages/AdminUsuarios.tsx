import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, ChevronLeft, ChevronRight, User as UserIcon, Loader2 } from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth, Profile } from '@/contexts/AuthContext'; // Importe Profile se precisar tipar
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/services/api'; // Importando a API

const ITEMS_PER_PAGE = 8;

// Interface baseada no retorno do Laravel
interface StoredUser {
  id: number;
  name: string;
  email: string;
  birth_date: string;
  account_status: '0' | '1';
  is_admin: '0' | '1';
  profiles?: Profile[];
}

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<StoredUser | null>(null);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // 1. CORREÇÃO DE SEGURANÇA: Redirecionamento dentro do useEffect
  useEffect(() => {
    if (!isLoading) {
      if (!user || user.is_admin !== '1') {
        navigate('/login');
      }
    }
  }, [user, isLoading, navigate]);

  // 2. CARREGAMENTO DA API
  useEffect(() => {
    if (user?.is_admin === '1') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Nota: Você precisará criar a rota Route::get('/users', ...) no Laravel depois
      const response = await api.get('/users'); 
      // Filtra para não mostrar o próprio admin ou admins em geral, se desejar
      const allUsers = response.data;
      setUsers(allUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
      // Fallback vazio se a API falhar
      setUsers([]); 
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Se estiver carregando auth ou não for admin, não renderiza nada
  if (isLoading || !user || user.is_admin !== '1') {
    return null;
  }

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const searchLower = search.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleUserBlocked = async (userId: number, currentStatus: '0' | '1') => {
    try {
        const newStatus = currentStatus === '1' ? '0' : '1';
        // Chamada para API do Laravel
        await api.patch(`/users/${userId}/toggle-status`, { status: newStatus });
        
        // Atualiza lista localmente
        setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, account_status: newStatus } : u
        ));

        toast({
            title: newStatus === '0' ? "Usuário bloqueado" : "Usuário desbloqueado",
            description: "Status atualizado com sucesso."
        });
    } catch (error) {
        toast({
            title: "Erro",
            description: "Não foi possível alterar o status.",
            variant: "destructive"
        });
    }
  };

  const getTypeLabel = (birthDate: string) => {
    // Calculo simples de idade baseado na data
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (age < 12) return 'Infantil (0-11)';
    if (age < 18) return 'Juvenil (12-17)';
    return 'Adulto (18+)';
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 pt-16 lg:pt-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">Gerenciar Usuários</h1>
              <p className="text-sm text-muted-foreground">
                {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </header>

        {/* Users Grid */}
        <div className="p-4 sm:p-6">
          {isLoadingUsers ? (
             <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedUsers.map(u => (
                <div 
                  key={u.id}
                  className="bg-card rounded-lg p-4 border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <UserIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{u.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {getTypeLabel(u.birth_date)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.account_status === '1'}
                        onCheckedChange={() => toggleUserBlocked(u.id, u.account_status)}
                      />
                      <span className={`text-xs ${u.account_status === '0' ? 'text-destructive' : 'text-green-500'}`}>
                        {u.account_status === '0' ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUser(u)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Detalhes</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <p className="font-medium">{getTypeLabel(selectedUser.birth_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nascimento:</span>
                  <p className="font-medium">{new Date(selectedUser.birth_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className={`font-medium ${selectedUser.account_status === '0' ? 'text-destructive' : 'text-green-500'}`}>
                    {selectedUser.account_status === '0' ? 'Bloqueado' : 'Ativo'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Perfis:</span>
                  <p className="font-medium">{selectedUser.profiles?.length || 0}</p>
                </div>
              </div>

              {selectedUser.profiles && selectedUser.profiles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Perfis</h4>
                  <div className="space-y-2">
                    {selectedUser.profiles.map((profile: Profile) => (
                      <div 
                        key={profile.id || profile.pk_perfil}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <img 
                          src={profile.avatar} 
                          alt={profile.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm">{profile.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{profile.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}