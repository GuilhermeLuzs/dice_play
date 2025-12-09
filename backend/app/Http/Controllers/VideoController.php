<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\Tag;
use App\Models\Participante;
use App\Models\VideoPerfil;
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

    public function listarVideosAdm()
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

    public function favoritarVideo(Request $request, $id_video)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        try {
            // Validar entrada
            $request->validate([
                'fk_perfil' => 'required|integer|exists:perfis,pk_perfil'
            ]);

            $fk_perfil = $request->input('fk_perfil');

            // Verificar se o perfil pertence ao usuário
            $perfil = $user->perfis()->where('pk_perfil', $fk_perfil)->first();

            if (!$perfil) {
                return response()->json(['message' => 'Perfil não encontrado ou não pertence a você.'], 403);
            }

            // Verificar se o vídeo existe
            $video = Video::find($id_video);

            if (!$video) {
                return response()->json(['message' => 'Vídeo não encontrado.'], 404);
            }

            // Buscar registro existente
            $videoPerfil = VideoPerfil::where('fk_video', $id_video)
                ->where('fk_perfil', $fk_perfil)
                ->first();

            if ($videoPerfil) {
                // Se existe, alterna o valor de e_favorito_video_perfil
                $novoValor = $videoPerfil->e_favorito_video_perfil === '1' ? '0' : '1';

                $videoPerfil->e_favorito_video_perfil = $novoValor;
                $videoPerfil->save();

                $mensagem = $novoValor === '1'
                    ? 'Vídeo favoritado com sucesso!'
                    : 'Vídeo removido dos favoritos.';
            } else {
                // Se não existe, cria novo registro com favorito = '1'
                $videoPerfil = VideoPerfil::create([
                    'fk_video' => $id_video,
                    'fk_perfil' => $fk_perfil,
                    'andamento_video_perfil' => '00:00:00',
                    'e_favorito_video_perfil' => '1'
                ]);

                $mensagem = 'Vídeo favoritado com sucesso!';
            }

            return response()->json([
                'message' => $mensagem,
                'video_perfil' => $videoPerfil,
                'esta_favorito' => $videoPerfil->e_favorito_video_perfil === '1'
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Erro de validação
            return response()->json([
                'message' => 'Erro de validação.',
                'errors' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Ocorreu um erro interno ao favoritar o vídeo.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function assistirVideo(Request $request, $id_video)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        try {
            // Validar se o vídeo existe
            $video = Video::find($id_video);

            if (!$video) {
                return response()->json(['message' => 'Vídeo não encontrado.'], 404);
            }

            // Validar se o perfil está na requisição
            $request->validate([
                'fk_perfil' => 'required|integer|exists:perfis,pk_perfil'
            ]);

            $fk_perfil = $request->input('fk_perfil');

            // Verificar se o perfil pertence ao usuário
            $perfil = $user->perfis()->where('pk_perfil', $fk_perfil)->first();

            if (!$perfil) {
                return response()->json(['message' => 'Perfil não encontrado ou não pertence a você.'], 403);
            }

            // Verificar se já existe um registro para este vídeo e perfil
            $videoPerfil = VideoPerfil::where('fk_video', $id_video)
                ->where('fk_perfil', $fk_perfil)
                ->first();

            if ($videoPerfil) {
                // Se já existe, apenas retorna sucesso
                return response()->json([
                    'message' => 'Registro de visualização já existe.',
                    'video_perfil' => $videoPerfil
                ], 200);
            }

            // Criar novo registro
            $novoVideoPerfil = VideoPerfil::create([
                'fk_video' => $id_video,
                'fk_perfil' => $fk_perfil,
                'andamento_video_perfil' => '00:00:00',
                'e_favorito_video_perfil' => '0'
            ]);

            return response()->json([
                'message' => 'Registro de visualização criado com sucesso.',
                'video_perfil' => $novoVideoPerfil
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Ocorreu um erro interno ao registrar a visualização.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function listarFavoritos(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        try {
            // Validar entrada
            $request->validate([
                'fk_perfil' => 'required|integer|exists:perfis,pk_perfil',
                'search' => 'nullable|string|max:100',
                'tag' => 'nullable|integer|exists:tags,pk_tag',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            $fk_perfil = $request->input('fk_perfil');
            $search = $request->input('search', '');
            $tagId = $request->input('tag');
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);

            // Verificar se o perfil pertence ao usuário
            $perfil = $user->perfis()->where('pk_perfil', $fk_perfil)->first();
            
            if (!$perfil) {
                return response()->json(['message' => 'Perfil não encontrado ou não pertence a você.'], 403);
            }

            // Construir query base
            $query = Video::query()
                ->join('videos_perfis', function ($join) use ($fk_perfil) {
                    $join->on('videos.pk_video', '=', 'videos_perfis.fk_video')
                        ->where('videos_perfis.fk_perfil', '=', $fk_perfil)
                        ->where('videos_perfis.e_favorito_video_perfil', '=', '1');
                })
                ->with(['tags', 'participantes']) // Carrega relacionamentos
                ->select('videos.*', 'videos_perfis.e_favorito_video_perfil', 'videos_perfis.andamento_video_perfil');

            // Aplicar filtro de busca
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('videos.titulo_video', 'LIKE', "%{$search}%")
                      ->orWhere('videos.descricao_video', 'LIKE', "%{$search}%")
                      ->orWhere('videos.nome_canal_video', 'LIKE', "%{$search}%");
                });
            }

            // Aplicar filtro por tag
            if (!empty($tagId)) {
                $query->whereHas('tags', function ($q) use ($tagId) {
                    $q->where('tags.pk_tag', $tagId);
                });
            }

            // Ordenar por data de criação (mais recentes primeiro)
            $query->orderBy('videos.created_at', 'desc');

            // Paginação
            $total = $query->count();
            $videos = $query->paginate($perPage, ['*'], 'page', $page);

            // Formatar resposta
            $response = [
                'message' => 'Vídeos favoritos listados com sucesso.',
                'data' => $videos->items(),
                'pagination' => [
                    'current_page' => $videos->currentPage(),
                    'per_page' => $videos->perPage(),
                    'total' => $total,
                    'total_pages' => $videos->lastPage(),
                    'has_more_pages' => $videos->hasMorePages(),
                ],
                'filters' => [
                    'search' => $search,
                    'tag' => $tagId,
                ]
            ];

            return response()->json($response, 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erro de validação.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Ocorreu um erro interno ao listar os favoritos.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function atualizarMinutagem(Request $request, $id_video_perfil){

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
