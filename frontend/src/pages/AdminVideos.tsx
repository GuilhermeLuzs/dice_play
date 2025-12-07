import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { TagMultiSelect } from '@/components/TagMultiSelect';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
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

const ITEMS_PER_PAGE = 8;

export default function AdminVideos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { videos, addVideo, updateVideo, deleteVideo } = useVideos();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Add video form state
  const [newLink, setNewLink] = useState('');
  const [newRating, setNewRating] = useState('L');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newMaster, setNewMaster] = useState('');
  const [newPlayers, setNewPlayers] = useState<string[]>(['']);
  const [newDescription, setNewDescription] = useState('');

  // Edit video form state
  const [editLink, setEditLink] = useState('');
  const [editRating, setEditRating] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editMaster, setEditMaster] = useState('');
  const [editPlayers, setEditPlayers] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');

  if (!user || user.type !== 'admin') {
    navigate('/login');
    return null;
  }

  // Get all available tags from existing videos
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    videos.forEach(v => v.categories.forEach(c => tagsSet.add(c)));
    return Array.from(tagsSet).sort();
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (!search) return videos;
    const searchLower = search.toLowerCase();
    return videos.filter(v => 
      v.title.toLowerCase().includes(searchLower) ||
      v.channelName.toLowerCase().includes(searchLower) ||
      v.categories.some(c => c.toLowerCase().includes(searchLower))
    );
  }, [videos, search]);

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddVideo = () => {
    if (!newLink) {
      toast({
        title: "Link obrigatório",
        description: "Por favor, insira o link do vídeo.",
        variant: "destructive"
      });
      return;
    }

    addVideo({
      link: newLink,
      rating: newRating,
      categories: newTags,
      master: newMaster,
      participants: newPlayers.filter(p => p.trim()),
      description: newDescription
    });

    toast({
      title: "Vídeo adicionado",
      description: "O vídeo foi adicionado com sucesso."
    });

    setAddModalOpen(false);
    resetAddForm();
  };

  const resetAddForm = () => {
    setNewLink('');
    setNewRating('L');
    setNewTags([]);
    setNewMaster('');
    setNewPlayers(['']);
    setNewDescription('');
  };

  const handleEditVideo = () => {
    if (!editingVideo) return;

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

  const handleDeleteVideo = () => {
    if (!deletingVideo) return;

    deleteVideo(deletingVideo.id);

    toast({
      title: "Vídeo excluído",
      description: "O vídeo foi excluído com sucesso."
    });

    setDeletingVideo(null);
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setEditLink(video.link);
    setEditRating(video.rating);
    setEditTags(video.categories);
    setEditMaster(video.master);
    setEditPlayers(video.participants.length > 0 ? video.participants : ['']);
    setEditDescription(video.description);
  };

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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl">Gerenciar Vídeos</h1>
                <p className="text-sm text-muted-foreground">
                  {videos.length} vídeo{videos.length !== 1 ? 's' : ''} cadastrado{videos.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar vídeos..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setAddModalOpen(true)} className="shrink-0">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Video Grid */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedVideos.map(video => (
              <div 
                key={video.id}
                className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
              >
                <div className="relative aspect-video">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white ${getRatingColor(video.rating)}`}>
                    {video.rating}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-0.5 rounded text-xs font-medium">
                    {video.duration}
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{video.title}</h3>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {video.categories.slice(0, 2).map(cat => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {video.categories.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{video.categories.length - 2}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditModal(video)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setDeletingVideo(video)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

      {/* Add Video Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Vídeo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link">Link do Vídeo</Label>
              <Input
                id="link"
                placeholder="https://youtube.com/..."
                value={newLink}
                onChange={e => setNewLink(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição do vídeo..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Classificação Indicativa</Label>
              <Select value={newRating} onValueChange={setNewRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Label htmlFor="master">Nome do Mestre</Label>
              <Input
                id="master"
                placeholder="Nome do mestre da sessão"
                value={newMaster}
                onChange={e => setNewMaster(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Jogadores</Label>
              {newPlayers.map((player, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Jogador ${index + 1}`}
                    value={player}
                    onChange={e => updatePlayerField(index, e.target.value, false)}
                  />
                  {newPlayers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePlayerField(index, false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPlayerField(false)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Jogador
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagMultiSelect
                selectedTags={newTags}
                availableTags={allTags}
                onChange={setNewTags}
              />
            </div>

            <Button onClick={handleAddVideo} className="w-full">
              Adicionar Vídeo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Vídeo</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <img 
                src={selectedVideo.thumbnail} 
                alt={selectedVideo.title}
                className="w-full aspect-video object-cover rounded-lg"
              />
              <div>
                <h3 className="font-display text-xl">{selectedVideo.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedVideo.channelName}</p>
              </div>
              <p className="text-muted-foreground">{selectedVideo.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="ml-2">{selectedVideo.duration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Classificação:</span>
                  <span className="ml-2">{selectedVideo.rating}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Visualizações:</span>
                  <span className="ml-2">{selectedVideo.views.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Publicado:</span>
                  <span className="ml-2">{new Date(selectedVideo.publishedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Mestre:</span>
                <span className="ml-2">{selectedVideo.master}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Participantes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVideo.participants.map(p => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVideo.categories.map(c => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vídeo</DialogTitle>
          </DialogHeader>
          {editingVideo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-link">Link do Vídeo</Label>
                <Input
                  id="edit-link"
                  value={editLink}
                  onChange={e => setEditLink(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rating">Classificação Indicativa</Label>
                <Select value={editRating} onValueChange={setEditRating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="edit-master">Nome do Mestre</Label>
                <Input
                  id="edit-master"
                  value={editMaster}
                  onChange={e => setEditMaster(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Jogadores</Label>
                {editPlayers.map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Jogador ${index + 1}`}
                      value={player}
                      onChange={e => updatePlayerField(index, e.target.value, true)}
                    />
                    {editPlayers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePlayerField(index, true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPlayerField(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Jogador
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagMultiSelect
                  selectedTags={editTags}
                  availableTags={allTags}
                  onChange={setEditTags}
                />
              </div>

              <Button onClick={handleEditVideo} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingVideo} onOpenChange={() => setDeletingVideo(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vídeo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingVideo?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVideo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
