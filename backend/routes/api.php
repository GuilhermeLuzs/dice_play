<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\PerfilController;

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

    // --- Rotas Exclusivas de Admin ---
    Route::middleware('admin')->group(function () {
        Route::get('/users', [UserController::class, 'listarUsuarios']);
        Route::get('/users/{id}', [UserController::class, 'detalhesUsuario']);
        Route::patch('/users/{id}/alterar-status', [UserController::class, 'alterarStatusUsuario']); 
    });


});