<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->string('variant_name');
            $table->unsignedInteger('duration_minutes');
            $table->unsignedInteger('price_pln');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_variants');
    }
};
