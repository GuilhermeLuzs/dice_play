<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // Listar todos os usuários (exceto admins, se preferir)
    public function listarUsuarios()
    {
        // Trazemos todos os usuários que NÃO são admins
        // Carregamos 'perfis' para evitar consultas extras (Eager Loading)
        $users = User::where('is_admin', '0')
                    ->with('perfis.avatar')
                    ->orderBy('name')
                    ->get();

        return response()->json($users);
    }

    // Detalhes de um usuário específico
    public function detalhesUsuario($id)
    {
        $user = User::with('perfis.avatar')->findOrFail($id);
        return response()->json($user);
    }

    // Alternar Status (Bloquear/Desbloquear)
    public function alterarStatusUsuario(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:0,1'
        ]);

        $user = User::findOrFail($id);
        
        // Impede bloquear outro admin por segurança
        if ($user->is_admin === '1') {
            return response()->json(['message' => 'Não é possível bloquear um administrador.'], 403);
        }

        $user->account_status = $request->status;
        $user->save();

        return response()->json([
            'message' => 'Status atualizado com sucesso.',
            'user' => $user
        ]);
    }

    public function editarUsuario(Request $request)
    {
        // Pega o usuário autenticado via Token (Sanctum)
        $user = auth()->user();

        // Validação
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'birth_date' => 'required|date',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        // Atualiza campos básicos
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->birth_date = $validated['birth_date'];

        // Se a senha foi fornecida, faz o hash e atualiza
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Dados atualizados com sucesso.',
            'user' => $user->load('perfis.avatar') // Retorna o user atualizado com perfis
        ]);
    }
}