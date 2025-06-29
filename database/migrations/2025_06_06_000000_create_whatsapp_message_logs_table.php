<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_message_logs', function (Blueprint $table) {
            $table->id();
            $table->string('recipient');
            $table->string('template')->nullable();
            $table->json('parameters')->nullable();
            $table->string('status')->nullable();
            $table->string('response_id')->nullable();
            $table->integer('error_code')->nullable();
            $table->text('error_body')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_message_logs');
    }
};
