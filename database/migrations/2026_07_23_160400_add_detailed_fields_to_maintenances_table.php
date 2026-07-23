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
        Schema::table('maintenances', function (Blueprint $table) {
            $table->text('diagnosis')->nullable()->after('service_type');
            $table->text('work_to_be_done')->nullable()->after('diagnosis');
            $table->string('vehicle_location')->nullable()->after('work_to_be_done');
            $table->string('handled_by')->nullable()->after('vehicle_location');
            $table->string('supervised_by')->nullable()->after('handled_by');
            $table->string('company')->nullable()->after('supervised_by');
            $table->string('vehicle_user')->nullable()->after('company');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            $table->dropColumn([
                'diagnosis',
                'work_to_be_done',
                'vehicle_location',
                'handled_by',
                'supervised_by',
                'company',
                'vehicle_user',
            ]);
        });
    }
};
