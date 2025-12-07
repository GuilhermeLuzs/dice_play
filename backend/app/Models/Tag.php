<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $table = 'tags';
    protected $primaryKey = 'pk_tag';

    protected $fillable = ['nome_tag'];

    public function videos()
    {
        return $this->belongsToMany(Video::class, 'video_tags', 'fk_tag', 'fk_video')
            ->using(VideoTag::class)
            ->withPivot('pk_video_tag')
            ->withTimestamps();
    }
}
