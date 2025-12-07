<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    protected $table = 'videos';
    protected $primaryKey = 'pk_video';

    protected $fillable = [
        'titulo_video',
        'link_video',
        'descricao_video',
        'thumbnail_video',
        'data_publicacao_video',
        'classificacao_etaria_video',
        'duracao_video',
        'visualizacoes_video',
        'nome_canal_video',
        'foto_canal_video'
    ];

    protected $casts = [
        'data_publicacao_video' => 'date',
    ];

    // Tags do vídeo
    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'video_tags', 'fk_video', 'fk_tag')
            ->using(VideoTag::class)
            ->withPivot('pk_video_tag')
            ->withTimestamps();
    }

    // Participantes do vídeo
    public function participantes()
    {
        return $this->hasMany(Participante::class, 'fk_video', 'pk_video');
    }

    // Perfis que interagiram com o vídeo
    public function perfis()
    {
        return $this->belongsToMany(Perfil::class, 'videos_perfis', 'fk_video', 'fk_perfil')
            ->using(VideoPerfil::class)
            ->withPivot('pk_video_perfil', 'andamento_video_perfil', 'e_favorito_video_perfil')
            ->withTimestamps();
    }
}
