<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('participantes', function (Blueprint $table) {
            $table->id('pk_participante');
            $table->string('nome_participante', 100);
            $table->string('foto_participante', 255);
            $table->enum('e_mestre_participante', ['0', '1'])->default('0');
            $table->unsignedBigInteger('fk_video');
            $table->timestamps();

            $table->foreign('fk_video')->references('pk_video')->on('videos')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('participantes');
    }
};