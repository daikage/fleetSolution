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
        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Accepted', 'Rejected'])->default('Pending')->after('odometer_at_fill');
            $table->text('reviewer_comment')->nullable()->after('status');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete()->after('reviewer_comment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['status', 'reviewer_comment', 'assigned_to']);
        });
    }
};
