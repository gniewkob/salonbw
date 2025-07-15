<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite: musimy zrekonstruować kolumnę
        Schema::table('appointments', function (Blueprint $table) {
            // Dodaj tymczasową kolumnę z nową definicją
            $table->string('new_status')->default('zaplanowana');
        });

        // Zmapuj stare wartości
        DB::table('appointments')->update(['new_status' => DB::raw("
            CASE
                WHEN status = 'confirmed' THEN 'odbyta'
                WHEN status = 'cancelled' THEN 'odwołana'
                WHEN status = 'missed' THEN 'nieodbyta'
                WHEN status = 'planned' THEN 'zaplanowana'
                ELSE 'zaplanowana'
            END
        ")]);

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('status')->default('zaplanowana');
        });

        // Skopiuj dane z tymczasowej kolumny do nowej kolumny
        DB::table('appointments')->update([
            'status' => DB::raw('new_status')
        ]);

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('new_status');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->string('status')->default('confirmed');
        });
    }
};
