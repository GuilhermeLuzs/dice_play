<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoPerfil extends Model
{
    protected $table = 'tipos_perfil';
    protected $primaryKey = 'pk_tipo_perfil';
    
    protected $fillable = ['nome_tipo_perfil'];

    public function perfis()
    {
        return $this->hasMany(Perfil::class, 'fk_tipo_perfil', 'pk_tipo_perfil');
    }
}