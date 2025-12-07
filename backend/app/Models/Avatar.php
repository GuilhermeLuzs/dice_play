<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Avatar extends Model
{
    protected $table = 'avatares';
    protected $primaryKey = 'pk_avatar';
    
    protected $fillable = ['img_avatar'];

    public function perfis()
    {
        return $this->hasMany(Perfil::class, 'fk_avatar', 'pk_avatar');
    }
}
