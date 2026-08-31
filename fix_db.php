<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$affected = DB::table('documents')
    ->where('documentable_type', 'App\Domains\Fleet\Models\Vehicle')
    ->update(['documentable_type' => 'App\Models\Vehicle']);

echo "Updated $affected vehicle documents.\n";

$affectedDrivers = DB::table('documents')
    ->where('documentable_type', 'App\Domains\Driver\Models\Driver')
    ->update(['documentable_type' => 'App\Models\Driver']);

echo "Updated $affectedDrivers driver documents.\n";
