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
             $table->unsignedBigInteger('reply_to_id')->nullable()->after('id');
             $table->unsignedBigInteger('admin_id')->nullable()->after('user_id');
             $table->boolean('is_from_admin')->default(false)->after('admin_id');
             $table->boolean('is_read')->default(false)->after('is_from_admin');
         });
     }
     public function down()
     {
         Schema::table('kontakt_messages', function (Blueprint $table) {
             $table->dropColumn(['reply_to_id', 'admin_id', 'is_from_admin', 'is_read']);
         });
     }

};
