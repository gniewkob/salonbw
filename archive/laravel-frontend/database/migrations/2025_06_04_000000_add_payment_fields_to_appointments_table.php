<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedInteger('amount_paid_pln')->nullable()->after('products_used');
            $table->string('payment_method')->nullable()->after('amount_paid_pln');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['amount_paid_pln', 'payment_method']);
        });
    }
};
