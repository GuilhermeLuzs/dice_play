<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('perfis', function (Blueprint $table) {
            $table->id('pk_perfil');
            $table->string('nome_perfil', 100);
            $table->date('data_nascimento_perfil');
            
            // Chaves Estrangeiras
            $table->unsignedBigInteger('fk_tipo_perfil');
            $table->unsignedBigInteger('fk_avatar');
            $table->unsignedBigInteger('fk_user');

            $table->timestamps();

            // Constraints
            $table->foreign('fk_tipo_perfil')->references('pk_tipo_perfil')->on('tipos_perfil');
            $table->foreign('fk_avatar')->references('pk_avatar')->on('avatares');
            $table->foreign('fk_user')->references('id')->on('users');
        });
    }

    public function down()
    {
        Schema::dropIfExists('perfis');
    }
};