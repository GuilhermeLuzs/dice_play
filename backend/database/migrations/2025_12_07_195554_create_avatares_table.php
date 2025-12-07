<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('avatares', function (Blueprint $table) {
            $table->id('pk_avatar');
            $table->string('img_avatar', 100);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('avatares');
    }
};