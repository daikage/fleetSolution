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
        Schema::table('documents', function (Blueprint $table) {
            $table->enum('status', ['Pending Verification', 'Verified', 'Rejected'])->default('Verified')->after('id');
            $table->string('reference_number')->nullable()->after('status');
            $table->string('issuing_authority')->nullable()->after('reference_number');
            $table->boolean('is_archived')->default(false)->after('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['status', 'reference_number', 'issuing_authority', 'is_archived']);
        });
    }
};
