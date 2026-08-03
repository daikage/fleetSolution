<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Drop the check constraints on status columns that prevent 'Under Review'.
     * In PostgreSQL, Laravel creates enum columns using VARCHAR with a CHECK constraint.
     * The previous migration altered the column type but left the check constraint intact.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            // Drop check constraints created by Laravel for the enum column
            DB::statement('ALTER TABLE maintenances DROP CONSTRAINT IF EXISTS maintenances_status_check');
            DB::statement('ALTER TABLE fuel_logs DROP CONSTRAINT IF EXISTS fuel_logs_status_check');
        }
    }

    public function down(): void
    {
        // No-op - we don't want to re-add the constraint as it would block 'Under Review'
    }
};
