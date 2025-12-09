<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\VideoController;

// Rotas Abertas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas Protegidas (Exigem Token Bearer)
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    //Rotas para perfil
    Route::post('/perfil', [PerfilController::class, 'criarPerfil']);
    Route::get('/perfil', [PerfilController::class, 'listarPerfis']);
    Route::get('/perfil/{id}', [PerfilController::class, 'detalhesPerfil']);
    Route::put('/perfil/{id}', [PerfilController::class, 'editarPerfil']);
    Route::delete('/perfil/{id}', [PerfilController::class, 'deletarPerfil']);

    //Rotas para avatar
    Route::get('/avatar', [AvatarController::class, 'listarAvatares']);

    Route::put('/user/update', [UserController::class, 'editarUsuario']);

    // --- Rotas de Vídeo Nível Usuário Autenticado ---
    // Estas rotas NÃO exigem ser Admin, apenas estar logado.
    Route::post('/videos/youtube-info', [VideoController::class, 'buscarDadosYoutube']); // Botão "Buscar Dados"
    Route::get('/tags', [VideoController::class, 'listarTags']); // Popula o select

    Route::get('/videos/filtros', [VideoController::class, 'listarFiltros']);
    Route::post('/videos/favoritar/{id_video}', [VideoController::class, 'favoritarVideo']);
    Route::get('/videos/favoritos', [VideoController::class, 'listarFavoritos']);
    Route::post('/videos/assistir/{id_video}', [VideoController::class, 'assistirVideo']);
    Route::get('/videos/assistindo', [VideoController::class, 'listarAssistindo']);

    // --- Rotas Exclusivas de Admin ---
    Route::middleware('admin')->group(function () {
        // Estas rotas exigem que o usuário esteja logado E seja Admin.

        Route::post('/videos', [VideoController::class, 'adicionarVideo']);
        Route::get('/videos', [VideoController::class, 'listarVideosAdm']);




        Route::get('/users', [UserController::class, 'listarUsuarios']);
        Route::get('/users/{id}', [UserController::class, 'detalhesUsuario']);
        Route::patch('/users/{id}/alterar-status', [UserController::class, 'alterarStatusUsuario']);
    });
});
