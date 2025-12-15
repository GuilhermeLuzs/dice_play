<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Video;
use App\Models\Perfil;
use App\Models\VideoPerfil;
use App\Models\Tag;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getStats()
    {
        // 1. Cards de Totais
        $totalUsers = User::where('is_admin', '0')->count();
        $totalVideos = Video::count();
        $totalProfiles = Perfil::count();
        
        // Total de visualizações ativas (vídeos que alguém começou a assistir)
        $totalViews = VideoPerfil::where('andamento_video_perfil', '!=', '00:00:00')->count();

        // 2. Gráfico: Top 5 Vídeos Mais Favoritados
        $topFavorites = Video::select('videos.titulo_video', DB::raw('count(videos_perfis.pk_video_perfil) as total'))
            ->join('videos_perfis', 'videos.pk_video', '=', 'videos_perfis.fk_video')
            ->where('videos_perfis.e_favorito_video_perfil', '1')
            ->groupBy('videos.pk_video', 'videos.titulo_video')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // 3. Gráfico: Top 5 Categorias (Tags) Mais Assistidas
        // CORREÇÃO: Nome da tabela pivô ajustado para 'video_tags'
        $topCategories = Tag::select('tags.nome_tag', DB::raw('count(videos_perfis.pk_video_perfil) as total'))
            ->join('video_tags', 'tags.pk_tag', '=', 'video_tags.fk_tag') // <--- CORRIGIDO AQUI
            ->join('videos_perfis', 'video_tags.fk_video', '=', 'videos_perfis.fk_video') // <--- E AQUI
            ->where('videos_perfis.andamento_video_perfil', '!=', '00:00:00') // Apenas se assistiu algo
            ->groupBy('tags.pk_tag', 'tags.nome_tag')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'cards' => [
                'users' => $totalUsers,
                'videos' => $totalVideos,
                'profiles' => $totalProfiles,
                'views' => $totalViews
            ],
            'charts' => [
                'favorites' => $topFavorites,
                'categories' => $topCategories
            ]
        ]);
    }
}