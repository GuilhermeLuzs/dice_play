<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('video_tags', function (Blueprint $table) {
            $table->id('pk_video_tag');
            $table->unsignedBigInteger('fk_video');
            $table->unsignedBigInteger('fk_tag');
            $table->timestamps();

            $table->foreign('fk_video')->references('pk_video')->on('videos')->onDelete('cascade');
            $table->foreign('fk_tag')->references('pk_tag')->on('tags')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('video_tags');
    }
};