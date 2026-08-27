<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'vehicle_license',
                'road_worthiness',
                'insurance',
                'stage_carriage',
                'mot',
                'hackney',
                'lg_papers',
                'battery',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('vehicle_license')->nullable();
            $table->string('road_worthiness')->nullable();
            $table->string('insurance')->nullable();
            $table->string('stage_carriage')->nullable();
            $table->string('mot')->nullable();
            $table->string('hackney')->nullable();
            $table->string('lg_papers')->nullable();
            $table->string('battery')->nullable();
        });
    }
};
