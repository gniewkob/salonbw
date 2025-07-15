<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::table('kontakt_messages', function (Blueprint $table) {
			if (!Schema::hasColumn('kontakt_messages', 'category')) {
				$table->string('category')->nullable()->after('message');
			}

			if (!Schema::hasColumn('kontakt_messages', 'status')) {
				$table->enum('status', ['nowa', 'odczytana', 'zamknieta'])->default('nowa')->after('category');
			}

			if (!Schema::hasColumn('kontakt_messages', 'email')) {
				$table->string('email')->nullable()->after('name');
			}

			if (!Schema::hasColumn('kontakt_messages', 'phone')) {
				$table->string('phone', 30)->nullable()->after('email');
			}

			// Upewnij się, że pola boolean mają domyślne wartości
			$table->boolean('is_read')->default(false)->change();
			$table->boolean('is_from_admin')->default(false)->change();
		});
	}

	public function down(): void
	{
		Schema::table('kontakt_messages', function (Blueprint $table) {
			$table->dropColumn(['category', 'status', 'email', 'phone']);
		});
	}
};
