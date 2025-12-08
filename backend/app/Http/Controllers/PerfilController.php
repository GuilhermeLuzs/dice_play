<?php

namespace App\Http\Controllers;

use App\Models\Perfil;
use Carbon\Carbon;
use Dotenv\Exception\ValidationException;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PerfilController extends Controller
{
    public function criarPerfil(Request $request) // 1. Injeção correta do Request
    {

        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        // 2. Verifica se o usuário esta autenticado e/ou autorizado nesta página
        if ($user->is_admin === '1') {
            return response()->json(['message' => 'Administradores não podem criar perfis de usuários. Não autorizado.'], 401);
        }

        // 3. Definição das Regras (removendo 'fk_user' da validação de entrada)
        $regras = [
            'nome_perfil' => ['required', 'string', 'max:100'],
            'data_nascimento_perfil' => ['required', 'date', 'before:today'],
            'fk_avatar' => ['required', 'integer', 'exists:avatares,pk_avatar'],
        ];

        // Usa o relacionamento 'perfis()' definido no Model User e chama count() no query builder.
        $quant_perfil = $user->perfis()->count();

        if ($quant_perfil >= 5) {
            // 3. CORREÇÃO: Código HTTP 403 Forbidden para limite excedido
            return response()->json([
                'message' => 'Limite máximo de 5 perfis por usuários atingido.',
            ], 403);
        }

        try {

            $dadosValidados = $request->validate($regras);

            $fk_tipo_calculado = $this->calcularFkTipoPerfil($dadosValidados['data_nascimento_perfil']);

            $dadosValidados['fk_user'] = $user->id;

            $dadosValidados['fk_tipo_perfil'] = $fk_tipo_calculado;

            $perfil = Perfil::create($dadosValidados);

            return response()->json([
                'message' => 'Perfil criado com sucesso.',
                'perfil' => $perfil,
            ], 201);
        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Ocorreu um erro interno ao tentar criar o perfil.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function listarPerfis()
    {

        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        try {
            $perfis = $user->perfis()
                ->with(['avatar', 'tipoPerfil'])
                ->get();

            if ($perfis->isEmpty()) {
                return response()->json(['message' => 'Nenhum perfil encontrado para este usuário.'], 200);
            }

            return response()->json([
                'message' => 'Perfis carregados com sucesso.',
                'perfis' => $perfis,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Ocorreu um erro interno ao tentar listar os perfis.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function detalhesPerfil($id_perfil)
    {

        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }


        try {
            $perfil = $user->perfis()
                ->with(['avatar', 'tipoPerfil'])
                ->where('pk_perfil', $id_perfil)
                ->first();

            if (!$perfil) {
                return response()->json(['message' => 'Perfil não encontrado.'], 401);
            }

            return response()->json([
                'message' => 'Dados do perfil carregados com sucesso.',
                'perfil' => $perfil,
            ], 200);
        } catch (ValidationException $e) {
            // 6. Tratamento de Erro de Validação (ID Inválido/Inexistente)
            // Se o ID não for um número ou não existir no DB.
            return response()->json([
                'message' => 'ID de perfil incorreto ou inexistente.',
            ], 422); // 422 Unprocessable Entity

        } catch (Exception $e) {
            // 7. Tratamento de Outros Erros (Conexão com DB, etc.)
            return response()->json([
                'message' => 'Ocorreu um erro interno ao acessar os detalhes do perfil.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function editarPerfil(Request $request, $id_perfil)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        // 1. Busca do Perfil
        // Usamos findOrFail para retornar 404 automaticamente se não for encontrado.
        $perfil = Perfil::find($id_perfil);

        if (!$perfil) {
            // Retorna 404 Not Found se o perfil não for encontrado
            return response()->json(['message' => 'Perfil não encontrado.'], 404);
        }

        // 2. Verificação de Propriedade (Autorização)
        if ($perfil->fk_user !== $user->id) {
            // Retorna 403 Forbidden se o perfil não pertencer ao usuário logado
            return response()->json(['message' => 'Você não tem permissão para editar este perfil.'], 403);
        }

        // 3. Regras de Validação
        $regras = [
            'nome_perfil' => ['sometimes', 'required', 'string', 'max:100'], // 'sometimes' para permitir que o campo seja opcional no PATCH
            'data_nascimento_perfil' => ['sometimes', 'required', 'date', 'before:today'],
            'fk_avatar' => ['sometimes', 'required', 'integer', 'exists:avatares,pk_avatar'],
        ];

        try {
            // A validação usa Request::validate()
            // Obs: Se for PATCH/PUT, use 'sometimes' nas regras para validar apenas campos presentes.
            $dadosValidados = $request->validate($regras);

            // 4. Se a data de nascimento foi alterada, recalcula o tipo
            if (isset($dadosValidados['data_nascimento_perfil'])) {
                $fk_tipo_calculado = $this->calcularFkTipoPerfil($dadosValidados['data_nascimento_perfil']);
                // Adiciona o FK calculado aos dados de update
                $dadosValidados['fk_tipo_perfil'] = $fk_tipo_calculado;
            }

            // 5. ATUALIZAÇÃO: Usa o método update() na instância do perfil
            $perfil->update($dadosValidados);

            // O retorno deve ser o perfil atualizado. O método update() retorna true/false,
            // então usamos a instância $perfil que já está com os dados novos.
            return response()->json([
                'message' => 'Perfil editado com sucesso.',
                // Carrega os relacionamentos para o retorno (opcional, mas útil)
                'perfil' => $perfil->load(['avatar', 'tipoPerfil'])
            ], 200);
        } catch (ValidationException $e) {
            // 6. Tratamento de Erro de Validação
            return response()->json([
                'message' => 'Erro de validação nos dados fornecidos.',
                'errors' => $e->getMessage()
            ], 422);
        } catch (Exception $e) {
            // 7. Tratamento de Erro Interno
            return response()->json([
                'message' => 'Erro interno ao editar perfil.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deletarPerfil($id_perfil)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        $perfil = Perfil::find($id_perfil);

        if (!$perfil) {
            return response()->json(['message' => 'Perfil não encontrado'], 401);
        }

        if ($perfil->fk_user !== $user->id) {
            return response()->json(['message' => 'Não é permitido deletar perfis que não são seus.'], 401);
        }

        try {
            $perfil->delete($id_perfil);

            return response()->json([
                'message' => 'Pefil excluído com sucesso.'
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Erro interno ao excluir usuário.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function calcularFkTipoPerfil(string $dataNascimento): int
    {
        // Cria um objeto Carbon a partir da data de nascimento
        $nascimento = Carbon::parse($dataNascimento);
        // Calcula a idade em anos
        $idade = $nascimento->age;

        if ($idade >= 18) {
            return 3; // Adulto
        } elseif ($idade >= 12) {
            return 2; // Juvenil
        } else {
            return 1; // Infantil
        }
    }
}
