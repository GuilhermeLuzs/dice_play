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

        $apiKey = config('services.youtube.key');
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

        if ($videoResponse->failed()) {
            return response()->json([
                'status_erro' => 'O Google recusou a conexão',
                'codigo_http' => $videoResponse->status(),
                'resposta_google' => $videoResponse->json(), // AQUI ESTÁ O OURO
                'chave_que_o_laravel_usou' => $apiKey, // Confira se bate com a do navegador
                'id_buscado' => $videoId
            ], 400);
        }

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

    public function listarVideosPublico()
    {
        // Usuário logado (qualquer um) pode ver
        // $user = Auth::user();
        // if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        // Retorna todos os vídeos com as relações necessárias para o Front montar os cards
        $videos = Video::with(['tags', 'participantes'])->get();

        return response()->json([
            'videos' => $videos, // O front espera { videos: [...] }
        ], 200);
    }

    public function favoritarVideo(Request $request, $id_video)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        if ($user->is_admin === '1') {
            return response()->json(['message' => 'Administradores não podem favoritar vídeos.'], 403);
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

    // 1. Detalhes do Vídeo (GET /videos/{id})
    public function detalhesVideo($id)
    {
        // Busca o vídeo com todos os relacionamentos necessários
        $video = Video::with(['tags', 'participantes'])->find($id);

        if (!$video) {
            return response()->json(['message' => 'Vídeo não encontrado.'], 404);
        }

        return response()->json([
            'message' => 'Detalhes do vídeo recuperados com sucesso.',
            'video' => $video
        ], 200);
    }

    // 2. Editar Vídeo (PUT /videos/{id})
    public function editarVideo(Request $request, $id)
    {
        $video = Video::find($id);

        if (!$video) {
            return response()->json(['message' => 'Vídeo não encontrado.'], 404);
        }

        // Validação (campos podem ser opcionais na edição dependendo do front, mas aqui validamos o que chega)
        $request->validate([
            'link_video' => 'nullable|url',
            'descricao_video' => 'nullable|string',
            'classificacao_etaria_video' => 'nullable|string',
            'tags' => 'array',
            'master' => 'nullable|string',
            'participantes' => 'array'
        ]);

        DB::beginTransaction();

        try {
            // Atualiza campos básicos do vídeo
            // Usamos $request->only para pegar apenas o que foi enviado para edição
            $video->update($request->only([
                'link_video',
                'descricao_video',
                'classificacao_etaria_video'
                // Título e Thumbnail geralmente não mudam na edição simples, mas podem ser adicionados se necessário
            ]));

            // Atualiza Tags
            if ($request->has('tags')) {
                $tagIds = [];
                foreach ($request->tags as $tagName) {
                    $tag = Tag::firstOrCreate(['nome_tag' => trim($tagName)]);
                    $tagIds[] = $tag->pk_tag;
                }
                // Sync remove as tags antigas e deixa apenas as novas
                $video->tags()->sync($tagIds);
            }

            // Atualiza Participantes (Mestre e Jogadores)
            // Estratégia: Limpar os atuais e recriar, para evitar duplicidade ou lógica complexa de update
            if ($request->has('master') || $request->has('participantes')) {
                // Remove todos os participantes atuais deste vídeo
                $video->participantes()->delete();

                // Recria o Mestre
                if ($request->filled('master')) {
                    Participante::create([
                        'nome_participante' => $request->master,
                        'foto_participante' => '',
                        'e_mestre_participante' => '1',
                        'fk_video' => $video->pk_video
                    ]);
                }

                // Recria os Jogadores
                if ($request->has('participantes')) {
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
            }

            DB::commit();

            // Retorna o vídeo atualizado com as relações recarregadas
            return response()->json([
                'message' => 'Vídeo atualizado com sucesso!',
                'video' => $video->load(['tags', 'participantes'])
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao atualizar o vídeo.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 3. Excluir Vídeo (DELETE /videos/{id})
    public function excluirVideo($id)
    {
        $video = Video::find($id);

        if (!$video) {
            return response()->json(['message' => 'Vídeo não encontrado.'], 404);
        }

        DB::beginTransaction();

        try {
            // Remove relacionamentos manualmente (caso o banco não tenha CASCADE configurado)
            $video->tags()->detach();
            $video->participantes()->delete();

            // Se houver registros na tabela videos_perfis (histórico/favoritos), deve deletar também
            // VideoPerfil::where('fk_video', $id)->delete();

            $video->delete();

            DB::commit();

            return response()->json(['message' => 'Vídeo excluído com sucesso.'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao excluir o vídeo. Verifique se existem dependências.',
                'error' => $e->getMessage()
            ], 500);
        }
    }




    // 1. Iniciar visualização (POST /videos/assistir/{id})
    public function assistirVideo(Request $request, $id_video)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        if ($user->is_admin === '1') {
            return response()->json(['message' => 'Administradores não podem iniciar sessões de vídeo.'], 403);
        }

        $request->validate(['fk_perfil' => 'required|integer|exists:perfis,pk_perfil']);
        $fk_perfil = $request->input('fk_perfil');

        // Valida propriedade do perfil
        $perfil = $user->perfis()->where('pk_perfil', $fk_perfil)->first();
        if (!$perfil) return response()->json(['message' => 'Forbidden.'], 403);

        // Busca ou cria o registro
        $videoPerfil = VideoPerfil::firstOrCreate(
            ['fk_video' => $id_video, 'fk_perfil' => $fk_perfil],
            ['andamento_video_perfil' => '00:00:00', 'e_favorito_video_perfil' => '0']
        );

        // Converte H:i:s para segundos para o frontend
        $segundos = $this->timeToSeconds($videoPerfil->andamento_video_perfil);

        return response()->json([
            'message' => 'Sessão iniciada.',
            'progresso_segundos' => $segundos
        ], 200);
    }

    // 2. Atualizar tempo (PUT /videos/progresso/{id})
    public function atualizarMinutagem(Request $request, $id_video)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        if ($user->is_admin === '1') {
            return response()->json(['message' => 'Administradores não podem salvar progresso.'], 403);
        }

        $request->validate([
            'fk_perfil' => 'required|integer|exists:perfis,pk_perfil',
            'tempo_atual' => 'required|numeric'
        ]);

        $fk_perfil = $request->input('fk_perfil');
        $segundos = $request->input('tempo_atual');

        $videoPerfil = VideoPerfil::where('fk_video', $id_video)
            ->where('fk_perfil', $fk_perfil)
            ->first();

        if ($videoPerfil) {
            // Converte segundos para H:i:s
            $videoPerfil->andamento_video_perfil = gmdate("H:i:s", (int)$segundos);
            $videoPerfil->updated_at = now(); // Importante para ordenar "Continuar Assistindo"
            $videoPerfil->save();
        }

        return response()->json(['message' => 'Progresso salvo.'], 200);
    }

    // 3. Listar Assistindo (GET /videos/assistindo)
    public function listarAssistindo(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $request->validate(['fk_perfil' => 'required|integer|exists:perfis,pk_perfil']);
        $fk_perfil = $request->input('fk_perfil');

        // Busca vídeos com progresso iniciado, ordenados pelo último update
        $videos = Video::join('videos_perfis', 'videos.pk_video', '=', 'videos_perfis.fk_video')
            ->where('videos_perfis.fk_perfil', $fk_perfil)
            ->where('videos_perfis.andamento_video_perfil', '!=', '00:00:00')
            ->select('videos.*', 'videos_perfis.andamento_video_perfil', 'videos_perfis.updated_at as ultimo_acesso')
            ->orderBy('videos_perfis.updated_at', 'desc')
            ->with(['tags', 'participantes'])
            ->get();

        // Formata para adicionar progresso em segundos
        $videosFormatados = $videos->map(function ($video) {
            $video->progresso_segundos = $this->timeToSeconds($video->andamento_video_perfil);
            return $video;
        });

        return response()->json(['videos' => $videosFormatados], 200);
    }

    // --- Helpers ---
    private function timeToSeconds($time)
    {
        $parts = explode(':', $time);
        return ($parts[0] * 3600) + ($parts[1] * 60) + $parts[2];
    }





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
