<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

// Note que estendemos 'Pivot' aqui para indicar que é uma tabela intermediária,
// mas como você tem uma PK auto-increment, pode estender 'Model' padrão também.
// Usar Pivot traz algumas vantagens em relacionamentos.
class VideoPerfil extends Pivot
{
    protected $table = 'videos_perfis';
    protected $primaryKey = 'pk_video_perfil';
    
    // O Laravel assume que tabelas pivot não têm PK auto-increment por padrão.
    // Como a sua tem, precisamos ativar isso:
    public $incrementing = true;

    protected $fillable = [
        'andamento_video_perfil',
        'e_favorito_video_perfil',
        'fk_video',
        'fk_perfil'
    ];

    // Se quiser acessar o video ou perfil a partir dessa tabela intermediária:
    public function video()
    {
        return $this->belongsTo(Video::class, 'fk_video', 'pk_video');
    }

    public function perfil()
    {
        return $this->belongsTo(Perfil::class, 'fk_perfil', 'pk_perfil');
    }
}