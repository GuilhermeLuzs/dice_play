<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('videos_perfis', function (Blueprint $table) {
            $table->id('pk_video_perfil');
            $table->time('andamento_video_perfil')->default('00:00:00');
            $table->enum('e_favorito_video_perfil', ['0', '1'])->default('0');
            
            $table->unsignedBigInteger('fk_video');
            $table->unsignedBigInteger('fk_perfil');
            
            $table->timestamps();

            $table->foreign('fk_video')->references('pk_video')->on('videos')->onDelete('cascade');
            $table->foreign('fk_perfil')->references('pk_perfil')->on('perfis')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('videos_perfis');
    }
};