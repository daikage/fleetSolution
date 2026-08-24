<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Widen the cost/price columns so they can handle values >= 1,000,000.
     * maintenances.cost was decimal(8,2) → max 999,999.99
     * fuel_logs.cost was decimal(10,2) → max 99,999,999.99
     * Both are now decimal(15,2) → max 9,999,999,999,999.99
     */
    public function up(): void
    {
        if (Schema::hasTable('maintenances')) {
            Schema::table('maintenances', function (Blueprint $table) {
                $table->decimal('cost', 15, 2)->nullable()->change();
            });
        }

        if (Schema::hasTable('fuel_logs')) {
            Schema::table('fuel_logs', function (Blueprint $table) {
                $table->decimal('cost', 15, 2)->change();
            });
        }

        if (Schema::hasTable('maintenance_vendors')) {
            Schema::table('maintenance_vendors', function (Blueprint $table) {
                $table->decimal('vendor_price', 15, 2)->default(0)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('maintenances')) {
            Schema::table('maintenances', function (Blueprint $table) {
                $table->decimal('cost', 8, 2)->nullable()->change();
            });
        }

        if (Schema::hasTable('fuel_logs')) {
            Schema::table('fuel_logs', function (Blueprint $table) {
                $table->decimal('cost', 10, 2)->change();
            });
        }

        if (Schema::hasTable('maintenance_vendors')) {
            Schema::table('maintenance_vendors', function (Blueprint $table) {
                $table->decimal('vendor_price', 10, 2)->default(0)->change();
            });
        }
    }
};
