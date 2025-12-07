<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tipos_perfil', function (Blueprint $table) {
            $table->id('pk_tipo_perfil');
            $table->string('nome_tipo_perfil', 100);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tipos_perfil');
    }
};