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
             $table->unsignedBigInteger('admin_id')->nullable()->after('user_id');
             $table->unsignedBigInteger('reply_to_id')->nullable()->after('admin_id');
             $table->boolean('is_from_admin')->default(false)->after('reply_to_id');
             $table->boolean('is_read')->default(false)->after('is_from_admin');
         });
     }

     public function down()
     {
         Schema::table('kontakt_messages', function (Blueprint $table) {
             $table->dropColumn(['user_id', 'admin_id', 'reply_to_id', 'is_from_admin', 'is_read']);
         });
     }

};
