<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Perfil extends Model
{
    protected $table = 'perfis';
    protected $primaryKey = 'pk_perfil';

    protected $fillable = [
        'nome_perfil',
        'data_nascimento_perfil',
        'fk_tipo_perfil',
        'fk_avatar',
        'fk_user'
    ];

    protected $casts = [
        'data_nascimento_perfil' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'fk_user', 'id');
    }

    public function tipoPerfil()
    {
        return $this->belongsTo(TipoPerfil::class, 'fk_tipo_perfil', 'pk_tipo_perfil');
    }

    public function avatar()
    {
        return $this->belongsTo(Avatar::class, 'fk_avatar', 'pk_avatar');
    }


    public function videos()
    {
        return $this->belongsToMany(Video::class, 'videos_perfis', 'fk_perfil', 'fk_video')
            ->using(VideoPerfil::class)
            ->withPivot('pk_video_perfil', 'andamento_video_perfil', 'e_favorito_video_perfil')
            ->withTimestamps();
    }
}
