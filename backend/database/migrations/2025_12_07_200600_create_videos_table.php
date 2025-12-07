<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id('pk_video');
            $table->string('titulo_video', 255);
            $table->string('link_video', 255);
            $table->string('descricao_video', 255);
            $table->string('thumbnail_video', 255);
            $table->date('data_publicacao_video');
            $table->string('classificacao_etaria_video', 255);
            $table->time('duracao_video');
            $table->integer('visualizacoes_video')->default(0);
            $table->string('nome_canal_video', 255);
            $table->string('foto_canal_video', 255);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('videos');
    }
};