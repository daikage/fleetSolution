<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$v = \App\Domains\Fleet\Models\Vehicle::first();
echo "Vehicle ID: " . $v->id . " | Plate: " . $v->license_plate . "\n";
echo "Doc Count on Relation: " . $v->documents->count() . "\n";

$docs = \App\Domains\Fleet\Models\Document::where('documentable_id', $v->id)->get();
echo "Docs direct query count: " . $docs->count() . "\n";
foreach($docs as $doc) {
    echo "Doc Type: " . $doc->document_type . " | documentable_type: " . $doc->documentable_type . " | is_archived: " . gettype($doc->is_archived) . "(" . $doc->is_archived . ")\n";
}
