<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Participante extends Model
{
    protected $table = 'participantes';
    protected $primaryKey = 'pk_participante';

    protected $fillable = [
        'nome_participante', 'foto_participante', 'e_mestre_participante', 'fk_video'
    ];

    public function video()
    {
        return $this->belongsTo(Video::class, 'fk_video', 'pk_video');
    }
}