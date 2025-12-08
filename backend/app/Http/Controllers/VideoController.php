<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\Tag;
use App\Models\Participante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use DateInterval;
use Exception;
use Illuminate\Support\Facades\Auth;

class VideoController extends Controller
{
    // Lista todas as tags para o Select do Admin
    public function listarTags()
    {
        // Retorna apenas os nomes das tags array de strings
        return response()->json(Tag::pluck('nome_tag'));
    }

    // Busca dados na API do YouTube
    public function buscarDadosYoutube(Request $request)
    {
        $request->validate(['link' => 'required|url']);

        $apiKey = env('YOUTUBE_API_KEY');
        $videoId = $this->extrairIdYoutube($request->link);

        if (!$videoId) {
            return response()->json(['message' => 'Link inválido.'], 400);
        }

        // 1. Busca detalhes do Vídeo
        $videoResponse = Http::get("https://www.googleapis.com/youtube/v3/videos", [
            'part' => 'snippet,contentDetails,statistics',
            'id' => $videoId,
            'key' => $apiKey
        ]);

        $videoData = $videoResponse->json()['items'][0] ?? null;

        if (!$videoData) {
            return response()->json(['message' => 'Vídeo não encontrado no YouTube.'], 404);
        }

        // 2. Busca detalhes do Canal (para pegar a foto)
        $channelId = $videoData['snippet']['channelId'];
        $channelResponse = Http::get("https://www.googleapis.com/youtube/v3/channels", [
            'part' => 'snippet',
            'id' => $channelId,
            'key' => $apiKey
        ]);

        $channelData = $channelResponse->json()['items'][0] ?? null;

        // 3. Formata os dados
        $dados = [
            'titulo_video' => $videoData['snippet']['title'],
            'descricao_video' => $videoData['snippet']['description'], // Opcional, pois o admin preenche
            'thumbnail_video' => $videoData['snippet']['thumbnails']['high']['url'] ?? '',
            'data_publicacao_video' => date('Y-m-d', strtotime($videoData['snippet']['publishedAt'])),
            'duracao_video' => $this->formatarDuracao($videoData['contentDetails']['duration']),
            'visualizacoes_video' => $videoData['statistics']['viewCount'] ?? 0,
            'nome_canal_video' => $videoData['snippet']['channelTitle'],
            'foto_canal_video' => $channelData['snippet']['thumbnails']['default']['url'] ?? '',
            'tags_sugeridas' => $videoData['snippet']['tags'] ?? []
        ];

        return response()->json($dados);
    }

    // Cria o vídeo, tags e participantes
    public function adicionarVideo(Request $request)
    {
        $validated = $request->validate([
            'link_video' => 'required|url',
            'titulo_video' => 'required|string',
            'thumbnail_video' => 'required|string',
            'descricao_video' => 'required|string',
            'classificacao_etaria_video' => 'required|string',
            'data_publicacao_video' => 'required|date',
            'duracao_video' => 'required|string', // Formato H:i:s
            'visualizacoes_video' => 'required|integer',
            'nome_canal_video' => 'required|string',
            'foto_canal_video' => 'required|string',
            // Arrays auxiliares
            'tags' => 'array', // Array de strings (nomes das tags)
            'master' => 'required|string',
            'participantes' => 'array' // Array de strings (nomes)
        ]);

        DB::beginTransaction();

        try {
            // 1. Criar o Vídeo
            $video = Video::create([
                'titulo_video' => $validated['titulo_video'],
                'link_video' => $validated['link_video'],
                'descricao_video' => $validated['descricao_video'],
                'thumbnail_video' => $validated['thumbnail_video'],
                'data_publicacao_video' => $validated['data_publicacao_video'],
                'classificacao_etaria_video' => $validated['classificacao_etaria_video'],
                'duracao_video' => $validated['duracao_video'],
                'visualizacoes_video' => $validated['visualizacoes_video'],
                'nome_canal_video' => $validated['nome_canal_video'],
                'foto_canal_video' => $validated['foto_canal_video'],
            ]);

            // 2. Processar Tags (Busca ID ou Cria Nova)
            $tagIds = [];
            foreach ($request->tags as $tagName) {
                // Find or Create pelo nome
                $tag = Tag::firstOrCreate(['nome_tag' => trim($tagName)]);
                $tagIds[] = $tag->pk_tag;
            }
            // Sincroniza na tabela pivô
            $video->tags()->sync($tagIds);

            // 3. Criar Mestre
            if (!empty($validated['master'])) {
                Participante::create([
                    'nome_participante' => $validated['master'],
                    'foto_participante' => '', // Pode ser genérica ou vazia por enquanto
                    'e_mestre_participante' => '1',
                    'fk_video' => $video->pk_video
                ]);
            }

            // 4. Criar Jogadores
            if (!empty($request->participantes)) {
                foreach ($request->participantes as $jogadorNome) {
                    if (!empty(trim($jogadorNome))) {
                        Participante::create([
                            'nome_participante' => $jogadorNome,
                            'foto_participante' => '',
                            'e_mestre_participante' => '0',
                            'fk_video' => $video->pk_video
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json(['message' => 'Vídeo criado com sucesso!', 'video' => $video], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro ao criar vídeo: ' . $e->getMessage()], 500);
        }
    }

    public function listarVideos()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        if ($user->is_admin === '0') {
            return response()->json(['message' => 'Não autorizado.'], 401);
        }

        try {

            $videos = Video::with(['tags', 'participantes'])->get();
            
            return response()->json([
                'message' => 'Vídeos listados com sucesso.',
                'videos' => $videos,
            ], 201);
        } catch (Exception $e) {

            return response()->json([
                'message' => 'Ocorreu um erro interno ao tentar listar os vídeos.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // --- Helpers Privados ---

    private function extrairIdYoutube($url)
    {
        // Regex poderosa para capturar ID de URLs completas, encurtadas (youtu.be) ou embed
        $pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i';

        if (preg_match($pattern, $url, $match)) {
            return $match[1];
        }

        return null;
    }

    private function formatarDuracao($isoDuration)
    {
        try {
            $interval = new \DateInterval($isoDuration); // Adicione a barra invertida \ antes de DateInterval
            return $interval->format('%H:%I:%S');
        } catch (\Exception $e) {
            return '00:00:00';
        }
    }
}
