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
            if (!Schema::hasColumn('kontakt_messages', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('kontakt_messages', 'admin_id')) {
                $table->unsignedBigInteger('admin_id')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('kontakt_messages', 'reply_to_id')) {
                $table->unsignedBigInteger('reply_to_id')->nullable()->after('admin_id');
            }
            if (!Schema::hasColumn('kontakt_messages', 'is_from_admin')) {
                $table->boolean('is_from_admin')->default(false)->after('reply_to_id');
            }
            if (!Schema::hasColumn('kontakt_messages', 'is_read')) {
                $table->boolean('is_read')->default(false)->after('is_from_admin');
            }
        });
     }

     public function down()
     {
        Schema::table('kontakt_messages', function (Blueprint $table) {
            if (Schema::hasColumn('kontakt_messages', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('kontakt_messages', 'admin_id')) {
                $table->dropColumn('admin_id');
            }
            if (Schema::hasColumn('kontakt_messages', 'reply_to_id')) {
                $table->dropColumn('reply_to_id');
            }
            if (Schema::hasColumn('kontakt_messages', 'is_from_admin')) {
                $table->dropColumn('is_from_admin');
            }
            if (Schema::hasColumn('kontakt_messages', 'is_read')) {
                $table->dropColumn('is_read');
            }
        });
     }

};
