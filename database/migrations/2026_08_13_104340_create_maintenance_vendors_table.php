<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('maintenance_vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maintenance_id')->constrained('maintenances')->onDelete('cascade');
            $table->string('vendor_name');
            $table->decimal('vendor_price', 10, 2)->default(0);
            $table->text('additional_comments')->nullable();
            $table->timestamps();
        });

        // Migrate existing company data
        $maintenances = DB::table('maintenances')->whereNotNull('company')->get();
        foreach ($maintenances as $maintenance) {
            DB::table('maintenance_vendors')->insert([
                'maintenance_id' => $maintenance->id,
                'vendor_name' => $maintenance->company,
                'vendor_price' => $maintenance->cost,
                'additional_comments' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_vendors');
    }
};
