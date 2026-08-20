<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Documents the addition of the 'accountant' role to the users table.
     * Since the 'role' column is a plain varchar string, no schema change is needed.
     * Valid roles are now: superadmin, admin, manager, driver, accountant
     */
    public function up(): void
    {
        // The role column is already a varchar string that accepts any value.
        // This migration serves as documentation that 'accountant' is now a valid role.
        // No schema changes required.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No schema changes to reverse.
    }
};
