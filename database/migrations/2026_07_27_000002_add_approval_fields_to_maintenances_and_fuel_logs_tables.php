<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            if (!Schema::hasColumn('maintenances', 'status')) {
                $table->string('status')->default('Pending')->after('id');
            }
            if (!Schema::hasColumn('maintenances', 'reviewer_comment')) {
                $table->text('reviewer_comment')->nullable()->after('status');
            }
            if (!Schema::hasColumn('maintenances', 'assigned_to')) {
                $table->string('assigned_to')->nullable()->after('reviewer_comment');
            }
        });

        Schema::table('fuel_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('fuel_logs', 'status')) {
                $table->string('status')->default('Pending')->after('id');
            }
            if (!Schema::hasColumn('fuel_logs', 'reviewer_comment')) {
                $table->text('reviewer_comment')->nullable()->after('status');
            }
            if (!Schema::hasColumn('fuel_logs', 'assigned_to')) {
                $table->string('assigned_to')->nullable()->after('reviewer_comment');
            }
        });
    }

    public function down(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            $table->dropColumn(['status', 'reviewer_comment', 'assigned_to']);
        });

        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->dropColumn(['status', 'reviewer_comment', 'assigned_to']);
        });
    }
};