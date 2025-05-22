<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
     {
         Schema::table('kontakt_messages', function (Blueprint $table) {
             $table->unsignedBigInteger('user_id')->nullable()->after('id');
         });
     }
     public function down()
     {
         Schema::table('kontakt_messages', function (Blueprint $table) {
             $table->dropColumn('user_id');
         });
     }
};
