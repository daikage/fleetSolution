<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // New columns
            $table->string('vehicle_id')->unique()->nullable()->after('id');
            $table->string('name')->nullable()->after('vehicle_id');
            $table->string('chassis_number')->nullable()->after('name');
            $table->string('base_location')->nullable()->after('chassis_number');
            $table->string('color')->nullable()->after('base_location');
            $table->string('assigned_user')->nullable()->after('color');
            $table->string('vehicle_license')->nullable()->after('assigned_user');
            $table->string('road_worthiness')->nullable()->after('vehicle_license');
            $table->string('insurance')->nullable()->after('road_worthiness');
            $table->string('stage_carriage')->nullable()->after('insurance');
            $table->string('mot')->nullable()->after('stage_carriage');
            $table->string('hackney')->nullable()->after('mot');
            $table->string('lg_papers')->nullable()->after('hackney');
            $table->string('battery')->nullable()->after('lg_papers');

            // Make old columns nullable
            $table->string('make')->nullable()->change();
            $table->string('model')->nullable()->change();
            $table->integer('year')->nullable()->change();
            $table->string('vin')->nullable()->change();
            $table->string('license_plate')->nullable()->change();
            $table->integer('odometer')->nullable()->change();
        });

        // Backfill vehicle_id for existing records
        $vehicles = DB::table('vehicles')->orderBy('id')->get();
        $counter = 1;
        foreach ($vehicles as $vehicle) {
            $formattedId = 'veh' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            DB::table('vehicles')->where('id', $vehicle->id)->update([
                'vehicle_id' => $formattedId,
                'name' => trim($vehicle->make . ' ' . $vehicle->model) ?: null,
                'chassis_number' => $vehicle->vin
            ]);
            $counter++;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'vehicle_id', 'name', 'chassis_number', 'base_location', 'color', 
                'assigned_user', 'vehicle_license', 'road_worthiness', 'insurance', 
                'stage_carriage', 'mot', 'hackney', 'lg_papers', 'battery'
            ]);
        });
    }
};
