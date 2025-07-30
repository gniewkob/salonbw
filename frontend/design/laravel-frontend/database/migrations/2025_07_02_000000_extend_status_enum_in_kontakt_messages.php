<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE kontakt_messages MODIFY status ENUM('nowa','odczytana','zamknieta','wyslane') DEFAULT 'nowa'");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE kontakt_messages MODIFY status ENUM('nowa','odczytana','zamknieta') DEFAULT 'nowa'");
        }
    }
};
