<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Ensure status columns are VARCHAR(255) to support 'Under Review' status.
     * This migration is idempotent — safe to run even if the column is already VARCHAR.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: ALTER COLUMN TYPE is safe even if already VARCHAR
            DB::statement("ALTER TABLE maintenances ALTER COLUMN status TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE fuel_logs ALTER COLUMN status TYPE VARCHAR(255)");
        } elseif ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE maintenances MODIFY COLUMN status VARCHAR(255) DEFAULT 'Pending'");
            DB::statement("ALTER TABLE fuel_logs MODIFY COLUMN status VARCHAR(255) DEFAULT 'Pending'");
        } else {
            // SQLite and others
            Schema::table('maintenances', function (Blueprint $table) {
                $table->string('status')->default('Pending')->change();
            });
            Schema::table('fuel_logs', function (Blueprint $table) {
                $table->string('status')->default('Pending')->change();
            });
        }
    }

    public function down(): void
    {
        // No-op: we don't want to revert to enum as it would break 'Under Review' records
    }
};
