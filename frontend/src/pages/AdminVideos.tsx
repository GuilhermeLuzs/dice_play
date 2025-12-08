import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, X, Download, Loader2, Check 
} from 'lucide-react'; 
import { AdminSidebar } from '@/components/AdminSidebar';
import { TagMultiSelect } from '@/components/TagMultiSelect';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
// Certifique-se que o VideoContext exporta a interface Video e o hook useVideos
import { useVideos, Video } from '@/contexts/VideoContext'; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/services/api';

const ITEMS_PER_PAGE = 8;

function videoDuration(duration: string) {
    return duration || "00:00:00";
}

export default function AdminVideos() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  // 💡 ATENÇÃO: Os dados em 'videos' devem ser os DADOS JÁ MAPEADOS
  const { videos, deleteVideo, updateVideo } = useVideos(); 
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- Estados do Formulário de Criação (Novo Vídeo) ---
  const [newLink, setNewLink] = useState('');
  const [isLoadingYT, setIsLoadingYT] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRating, setNewRating] = useState('L');
  const [newDescription, setNewDescription] = useState('');
  const [newMaster, setNewMaster] = useState('');
  const [newPlayers, setNewPlayers] = useState<string[]>(['']);
  const [availableTags, setAvailableTags] = useState<string[]>([]); // Vindas do banco
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Selecionadas no input
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]); // Vindas do YT
  const [ytData, setYtData] = useState<any>(null);

  // --- Estados do Formulário de Edição ---
  const [editLink, setEditLink] = useState('');
  const [editRating, setEditRating] = useState('');
  // 💡 CORREÇÃO: O front-end usa 'categories', que é o array de nomes das tags.
  const [editTags, setEditTags] = useState<string[]>([]); 
  const [editMaster, setEditMaster] = useState('');
  const [editPlayers, setEditPlayers] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');

  // --- Efeitos ---
  useEffect(() => {
    if (!isLoading && (!user || user.is_admin !== '1')) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (addModalOpen || editingVideo) {
      loadTagsFromDb();
    }
  }, [addModalOpen, editingVideo]);

  const loadTagsFromDb = async () => {
    try {
      // 💡 ATENÇÃO: Esta rota '/tags' deve retornar apenas o nome das tags 
      // ou ser mapeada no front-end para retornar um array de strings.
      const response = await api.get('/tags'); 
      // Assumindo que response.data é ['RPG', 'D&D', ...]
      setAvailableTags(response.data);
    } catch (error) {
      console.error("Erro ao carregar tags", error);
    }
  };

  // --- Lógica de YouTube API (Novo Vídeo) ---
  const handleFetchYoutubeData = async () => {
    if (!newLink) {
      toast({ title: "Erro", description: "Insira um link do YouTube.", variant: "destructive" });
      return;
    }

    setIsLoadingYT(true);
    try {
      const response = await api.post('/videos/youtube-info', { link: newLink });
      const data = response.data;

      setYtData(data);
      setSuggestedTags(data.tags_sugeridas || []);
      
      if (!newDescription) {
        setNewDescription(data.descricao_video ? data.descricao_video.slice(0, 500) + "..." : ""); 
      }

      toast({ title: "Dados carregados!", description: `Título: ${data.titulo_video}` });
    } catch (error: any) { 
      console.error("Erro completo:", error);
      
      const errorMessage = error.response?.data?.message || "Não foi possível buscar os dados do vídeo.";
      
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsLoadingYT(false);
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setSuggestedTags(suggestedTags.filter(t => t !== tag));
  };

  // --- Lógica de Salvar Novo Vídeo ---
  const handleAddVideo = async () => {
    if (!ytData) {
      toast({ title: "Erro", description: "Busque os dados do vídeo primeiro.", variant: "destructive" });
      return;
    }
    if (!newMaster) {
      toast({ title: "Erro", description: "O nome do Mestre é obrigatório.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // 💡 PAYLOAD: Enviando os dados no formato que o Laravel espera (snake_case + tags como array de nomes)
      const payload = {
        link_video: newLink,
        descricao_video: newDescription,
        classificacao_etaria_video: newRating,
        master: newMaster,
        participantes: newPlayers.filter(p => p.trim() !== ''),
        tags: selectedTags, // Array de nomes das tags
        titulo_video: ytData.titulo_video,
        thumbnail_video: ytData.thumbnail_video,
        data_publicacao_video: ytData.data_publicacao_video,
        duracao_video: ytData.duracao_video,
        visualizacoes_video: ytData.visualizacoes_video,
        nome_canal_video: ytData.nome_canal_video,
        foto_canal_video: ytData.foto_canal_video,
      };

      await api.post('/videos', payload);

      toast({ title: "Sucesso", description: "Vídeo adicionado ao catálogo." });
      setAddModalOpen(false);
      resetAddForm();
      // O ideal é chamar a função de fetch do Context, mas o reload funciona como fallback rápido
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao salvar o vídeo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetAddForm = () => {
    setNewLink('');
    setNewRating('L');
    setSelectedTags([]);
    setSuggestedTags([]);
    setNewMaster('');
    setNewPlayers(['']);
    setNewDescription('');
    setYtData(null);
  };

  // --- Funções de ADMIN: DELETE e EDIT ---

  const handleDeleteVideo = () => {
    if (!deletingVideo) return;

    // 💡 CORREÇÃO/AJUSTE: Usa o ID do objeto mapeado
    deleteVideo(deletingVideo.id);

    toast({
      title: "Vídeo excluído",
      description: "O vídeo foi excluído com sucesso."
    });

    setDeletingVideo(null);
  };

  const handleEditVideo = () => {
    if (!editingVideo) return;

    // 💡 CORREÇÃO/AJUSTE: Usa o ID do objeto mapeado e passa os campos do estado de edição
    updateVideo(editingVideo.id, {
      link: editLink,
      rating: editRating,
      categories: editTags,
      master: editMaster,
      participants: editPlayers.filter(p => p.trim()),
      description: editDescription
    });

    toast({
      title: "Vídeo atualizado",
      description: "O vídeo foi atualizado com sucesso."
    });

    setEditingVideo(null);
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setEditLink(video.link);
    setEditRating(video.rating);
    setEditTags(video.categories); // Usa categories, que é o array de strings de tags
    setEditMaster(video.master);
    setEditPlayers(video.participants.length > 0 ? video.participants : ['']);
    setEditDescription(video.description);
  };

  // --- Helpers de Jogadores (Reutilizáveis para Add e Edit) ---
  const addPlayerField = (isEdit = false) => {
    if (isEdit) {
      setEditPlayers([...editPlayers, '']);
    } else {
      setNewPlayers([...newPlayers, '']);
    }
  };

  const updatePlayerField = (index: number, value: string, isEdit = false) => {
    if (isEdit) {
      const updated = [...editPlayers];
      updated[index] = value;
      setEditPlayers(updated);
    } else {
      const updated = [...newPlayers];
      updated[index] = value;
      setNewPlayers(updated);
    }
  };

  const removePlayerField = (index: number, isEdit = false) => {
    if (isEdit) {
      if (editPlayers.length > 1) {
        setEditPlayers(editPlayers.filter((_, i) => i !== index));
      }
    } else {
      if (newPlayers.length > 1) {
        setNewPlayers(newPlayers.filter((_, i) => i !== index));
      }
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating === 'L') return 'bg-green-500';
    const num = parseInt(rating);
    if (num <= 10) return 'bg-green-500';
    if (num <= 12) return 'bg-yellow-500';
    if (num <= 14) return 'bg-orange-500';
    if (num <= 16) return 'bg-red-500';
    return 'bg-red-700';
  };

  // --- Renderização ---
  if (isLoading || !user || user.is_admin !== '1') return null;

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      <main className={cn("flex-1 pt-16 lg:pt-0 transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">Gerenciar Vídeos</h1>
              <p className="text-sm text-muted-foreground">{videos.length} vídeos cadastrados</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => setAddModalOpen(true)} className="shrink-0">
                <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Listagem de Vídeos (Grid) */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedVideos.map(video => (
              <div key={video.id} className="bg-card rounded-lg overflow-hidden border border-border group">
                <div className="relative aspect-video">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white ${getRatingColor(video.rating)}`}>
                    {video.rating}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-xs font-medium">{video.duration}</div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{video.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {/* 💡 ACESSANDO 'categories' (Tags mapeadas) */}
                    {video.categories.slice(0, 2).map(cat => (
                      <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                    ))}
                    {video.categories.length > 2 && <Badge variant="secondary" className="text-xs">+{video.categories.length - 2}</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedVideo(video)}><Eye className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(video)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => setDeletingVideo(video)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL DE ADICIONAR VÍDEO --- */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Vídeo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Link do YouTube</Label>
              <div className="flex gap-2">
                <Input placeholder="https://www.youtube.com/watch?v=..." value={newLink} onChange={e => setNewLink(e.target.value)} />
                <Button onClick={handleFetchYoutubeData} disabled={isLoadingYT || !newLink} variant="secondary">
                  {isLoadingYT ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </Button>
              </div>
              {ytData && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Vídeo encontrado: {ytData.titulo_video.slice(0, 30)}...
                </p>
              )}
            </div>

            <div className={cn("space-y-4 transition-opacity", !ytData && "opacity-50 pointer-events-none")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classificação</Label>
                  <Select value={newRating} onValueChange={setNewRating}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Livre</SelectItem>
                      <SelectItem value="10">10 anos</SelectItem>
                      <SelectItem value="12">12 anos</SelectItem>
                      <SelectItem value="14">14 anos</SelectItem>
                      <SelectItem value="16">16 anos</SelectItem>
                      <SelectItem value="18">18 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mestre da Sessão</Label>
                  <Input placeholder="Nome do Mestre" value={newMaster} onChange={e => setNewMaster(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Sinopse da aventura..." value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} />
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <Label>Tags do Sistema</Label>
                <TagMultiSelect selectedTags={selectedTags} availableTags={availableTags} onChange={setSelectedTags} />
                
                {suggestedTags.length > 0 && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs text-muted-foreground">Sugeridas do YouTube (Clique para adicionar)</Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => handleAddSuggestedTag(tag)}
                        >
                          + {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Jogadores</Label>
                {newPlayers.map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <Input placeholder={`Nome do Jogador ${index + 1}`} value={player} onChange={e => updatePlayerField(index, e.target.value)} />
                    {newPlayers.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePlayerField(index)}><X className="w-4 h-4" /></Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addPlayerField(false)} className="w-full text-xs h-8">
                  <Plus className="w-3 h-3 mr-2" /> Adicionar Jogador
                </Button>
              </div>

              <Button onClick={handleAddVideo} className="w-full" disabled={isSaving || !ytData}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Vídeo no Catálogo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE DETALHES --- */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do Vídeo</DialogTitle></DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full aspect-video object-cover rounded-lg" />
              <div><h3 className="font-display text-xl">{selectedVideo.title}</h3><p className="text-sm text-muted-foreground mt-1">{selectedVideo.channelName}</p></div>
              <p className="text-muted-foreground">{selectedVideo.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Duração:</span> <span className="ml-2">{videoDuration(selectedVideo.duration)}</span></div>
                <div><span className="text-muted-foreground">Classificação:</span> <span className="ml-2">{selectedVideo.rating}</span></div>
                <div><span className="text-muted-foreground">Visualizações:</span> <span className="ml-2">{selectedVideo.views.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Publicado:</span> <span className="ml-2">{new Date(selectedVideo.publishedAt).toLocaleDateString('pt-BR')}</span></div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Mestre:</span> <span className="ml-2">{selectedVideo.master}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Participantes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVideo.participants.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {/* 💡 ACESSANDO 'categories' (Tags mapeadas) */}
                  {selectedVideo.categories.map(c => <Badge key={c} variant="outline">{c}</Badge>)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE EDIÇÃO --- */}
      <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vídeo: {editingVideo?.title}</DialogTitle>
          </DialogHeader>
          {editingVideo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Link do Vídeo</Label>
                <Input value={editLink} onChange={e => setEditLink(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Classificação</Label>
                <Select value={editRating} onValueChange={setEditRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Livre</SelectItem>
                    <SelectItem value="10">10 anos</SelectItem>
                    <SelectItem value="12">12 anos</SelectItem>
                    <SelectItem value="14">14 anos</SelectItem>
                    <SelectItem value="16">16 anos</SelectItem>
                    <SelectItem value="18">18 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <Label>Tags do Sistema</Label>
                  {/* 💡 ACESSANDO 'editTags' (Mapeado de categories) */}
                  <TagMultiSelect selectedTags={editTags} availableTags={availableTags} onChange={setEditTags} />
              </div>

              <div className="space-y-2">
                <Label>Mestre</Label>
                <Input placeholder="Nome do Mestre" value={editMaster} onChange={e => setEditMaster(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Jogadores</Label>
                {editPlayers.map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <Input placeholder={`Nome do Jogador ${index + 1}`} value={player} onChange={e => updatePlayerField(index, e.target.value, true)} />
                    {editPlayers.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePlayerField(index, true)}><X className="w-4 h-4" /></Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addPlayerField(true)} className="w-full text-xs h-8">
                  <Plus className="w-3 h-3 mr-2" /> Adicionar Jogador
                </Button>
              </div>

              <Button onClick={handleEditVideo} className="w-full">
                Salvar Alterações
              </Button>

            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* --- MODAL DE DELETAR --- */}
      <AlertDialog open={!!deletingVideo} onOpenChange={() => setDeletingVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo **"{deletingVideo?.title}"** será permanentemente removido do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVideo} className="bg-destructive hover:bg-red-700">
              Sim, Excluir Vídeo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}