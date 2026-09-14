<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a unique index on vehicle_id to prevent duplicate codes.
     * First backfills any vehicles missing a code (e.g. from before the
     * created-hook change) so the unique index can be applied safely.
     */
    public function up(): void
    {
        // Backfill any vehicles that still have a NULL/empty vehicle_id
        // using the deterministic id-based code format from the model.
        DB::table('vehicles')
            ->whereNull('vehicle_id')
            ->orWhere('vehicle_id', '')
            ->orderBy('id')
            ->get()
            ->each(function ($vehicle) {
                $code = 'veh'.str_pad((string) $vehicle->id, 3, '0', STR_PAD_LEFT);
                DB::table('vehicles')
                    ->where('id', $vehicle->id)
                    ->update(['vehicle_id' => $code]);
            });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->unique('vehicle_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropUnique(['vehicle_id']);
        });
    }
};
