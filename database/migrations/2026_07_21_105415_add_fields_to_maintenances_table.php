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
            $table->enum('type', ['Regular Servicing', 'Repair'])->default('Regular Servicing')->after('service_type');
            $table->enum('status', ['Pending', 'Accepted', 'Rejected'])->default('Pending')->after('date');
            $table->text('reviewer_comment')->nullable()->after('status');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete()->after('reviewer_comment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['type', 'status', 'reviewer_comment', 'assigned_to']);
        });
    }
};
