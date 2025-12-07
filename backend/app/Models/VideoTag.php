<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class VideoTag extends Pivot
{
    protected $table = 'video_tags';
    protected $primaryKey = 'pk_video_tag';
    public $incrementing = true;

    protected $fillable = [
        'fk_video',
        'fk_tag'
    ];

    public function video()
    {
        return $this->belongsTo(Video::class, 'fk_video', 'pk_video');
    }

    public function tag()
    {
        return $this->belongsTo(Tag::class, 'fk_tag', 'pk_tag');
    }
}