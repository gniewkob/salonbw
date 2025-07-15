<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up()
{
    Schema::table('appointments', function (Blueprint $table) {
        $table->text('note_client')->nullable()->after('service_variant_id');
        $table->text('note_internal')->nullable()->after('note_client');
    });
}
public function down()
{
    Schema::table('appointments', function (Blueprint $table) {
        $table->dropColumn(['note_client', 'note_internal']);
    });
}
};
