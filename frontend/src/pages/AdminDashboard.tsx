import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Video, PlayCircle, UserCircle, Loader2, TrendingUp, Heart 
} from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';

interface DashboardStats {
  cards: {
    users: number;
    videos: number;
    profiles: number;
    views: number;
  };
  charts: {
    favorites: { titulo_video: string; total: number }[];
    categories: { nome_tag: string; total: number }[];
  };
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.is_admin !== '1') {
        navigate('/login');
      } else {
        fetchStats();
      }
    }
  }, [user, isLoading, navigate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (isLoading || !user || user.is_admin !== '1') return null;

  const COLORS = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      <main className={cn(
        "flex-1 pt-16 lg:pt-0 transition-all duration-300 bg-muted/10",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <div className="p-6 space-y-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl">Dashboard</h1>
              <p className="text-muted-foreground">Visão geral do sistema Dice Play.</p>
            </div>
            <div className="text-sm text-muted-foreground">
                Dados atualizados em tempo real
            </div>
          </div>

          {loadingStats ? (
             <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : stats && (
            <>
              {/* --- CARDS DE TOTAIS --- */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.cards.users}</div>
                    <p className="text-xs text-muted-foreground">Contas registradas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vídeos no Catálogo</CardTitle>
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.cards.videos}</div>
                    <p className="text-xs text-muted-foreground">Sessões disponíveis</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Perfis Ativos</CardTitle>
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.cards.profiles}</div>
                    <p className="text-xs text-muted-foreground">Perfis de espectadores</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sessões Iniciadas</CardTitle>
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.cards.views}</div>
                    <p className="text-xs text-muted-foreground">Vídeos em andamento</p>
                  </CardContent>
                </Card>
              </div>

              {/* --- GRÁFICOS --- */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                
                {/* Categorias Mais Assistidas (Bar Chart) */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Categorias Mais Populares
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.charts.categories}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis 
                                    dataKey="nome_tag" 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    allowDecimals={false}
                                />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ backgroundColor: '#1f1f1f', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {stats.charts.categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Vídeos Favoritos (List/Simple Bar) */}
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-primary" />
                        Top Favoritos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                        {stats.charts.favorites.map((video, i) => (
                            <div key={i} className="flex items-center">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary mr-3">
                                    {i + 1}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none truncate max-w-[200px]" title={video.titulo_video}>
                                        {video.titulo_video}
                                    </p>
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${(video.total / (stats.charts.favorites[0]?.total || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="font-medium text-sm ml-2 w-8 text-right">
                                    {video.total}
                                </div>
                            </div>
                        ))}
                        {stats.charts.favorites.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-8">Nenhum favorito ainda.</p>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}