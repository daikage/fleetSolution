<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->timestamp('last_tracking_report')->nullable()->after('push_token_updated_at');
            $table->string('tracking_status')->default('inactive')->after('last_tracking_report');
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['last_tracking_report', 'tracking_status']);
        });
    }
};