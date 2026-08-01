<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Change status columns from enum to string to support 'Under Review' status.
     */
    public function up(): void
    {
        // Change maintenances.status from enum to string
        Schema::table('maintenances', function (Blueprint $table) {
            $table->string('status')->default('Pending')->change();
        });

        // Change fuel_logs.status from enum to string
        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->string('status')->default('Pending')->change();
        });
    }

    public function down(): void
    {
        // Revert any 'Under Review' statuses back to 'Pending' before changing column type
        DB::table('maintenances')->where('status', 'Under Review')->update(['status' => 'Pending']);
        DB::table('fuel_logs')->where('status', 'Under Review')->update(['status' => 'Pending']);

        Schema::table('maintenances', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Accepted', 'Rejected'])->default('Pending')->change();
        });

        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Accepted', 'Rejected'])->default('Pending')->change();
        });
    }
};
