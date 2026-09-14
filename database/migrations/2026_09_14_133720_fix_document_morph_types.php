<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * One-off fix: rewrite fully-qualified class names to morph-map aliases
     * in the documents table so polymorphic relationships resolve correctly
     * without needing a runtime "SILENT FIX" on every request.
     */
    public function up(): void
    {
        DB::table('documents')
            ->where('documentable_type', 'App\Domains\Fleet\Models\Vehicle')
            ->update(['documentable_type' => 'App\Models\Vehicle']);

        DB::table('documents')
            ->where('documentable_type', 'App\Domains\Driver\Models\Driver')
            ->update(['documentable_type' => 'App\Models\Driver']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('documents')
            ->where('documentable_type', 'App\Models\Vehicle')
            ->update(['documentable_type' => 'App\Domains\Fleet\Models\Vehicle']);

        DB::table('documents')
            ->where('documentable_type', 'App\Models\Driver')
            ->update(['documentable_type' => 'App\Domains\Driver\Models\Driver']);
    }
};
