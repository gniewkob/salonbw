<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
Schema::table('kontakt_messages', function (Blueprint $table) {
    $table->string('category')->nullable();
    $table->string('status')->default('nowa'); // lub ENUM z ograniczeniem
});
};
