<?php

namespace App\Http\Controllers;

use App\Models\Avatar;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AvatarController extends Controller
{
    public function listarAvatares()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        try{

        $avatares = Avatar::all();

         return response()->json([
                'message' => 'Avatares carregados com sucesso.',
                'avatares' => $avatares,
            ], 200);

        } catch(Exception $e){
              return response()->json([
                'message' => 'Ocorreu um erro interno ao listar os avatares.',
                'error' => $e->getMessage()
            ], 500);
        }



    }
}
