<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Change status columns from enum to string to support 'Under Review' status.
     * Uses raw SQL for maximum reliability across database drivers.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            // MySQL/MariaDB: modify the enum to include 'Under Review'
            DB::statement("ALTER TABLE maintenances MODIFY COLUMN status VARCHAR(255) DEFAULT 'Pending'");
            DB::statement("ALTER TABLE fuel_logs MODIFY COLUMN status VARCHAR(255) DEFAULT 'Pending'");
        } elseif ($driver === 'pgsql') {
            // PostgreSQL
            DB::statement("ALTER TABLE maintenances ALTER COLUMN status TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE fuel_logs ALTER COLUMN status TYPE VARCHAR(255)");
        } else {
            // SQLite and others: use Laravel's change method
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
        // Revert any 'Under Review' statuses back to 'Pending' before changing column type
        DB::table('maintenances')->where('status', 'Under Review')->update(['status' => 'Pending']);
        DB::table('fuel_logs')->where('status', 'Under Review')->update(['status' => 'Pending']);

        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE maintenances MODIFY COLUMN status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending'");
            DB::statement("ALTER TABLE fuel_logs MODIFY COLUMN status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending'");
        } else {
            Schema::table('maintenances', function (Blueprint $table) {
                $table->enum('status', ['Pending', 'Accepted', 'Rejected'])->default('Pending')->change();
            });
            Schema::table('fuel_logs', function (Blueprint $table) {
                $table->enum('status', ['Pending', 'Accepted', 'Rejected'])->default('Pending')->change();
            });
        }
    }
};
