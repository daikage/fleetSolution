<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->decimal('start_odometer', 10, 2)->nullable()->after('start_time');
            $table->decimal('end_odometer', 10, 2)->nullable()->after('end_time');
            $table->string('start_location')->nullable()->after('end_odometer');
            $table->string('end_location')->nullable()->after('start_location');
            $table->decimal('distance_km', 10, 2)->nullable()->after('end_location');
            $table->integer('duration_minutes')->nullable()->after('distance_km');
            $table->string('status')->default('active')->after('duration_minutes');
            $table->text('notes')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn([
                'start_odometer',
                'end_odometer',
                'start_location',
                'end_location',
                'distance_km',
                'duration_minutes',
                'status',
                'notes',
            ]);
        });
    }
};