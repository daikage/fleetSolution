<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:check-document-expiries')]
#[Description('Check for compliance documents expiring in 30, 14, or 1 days and send email notifications.')]
class CheckDocumentExpiries extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $documents = \App\Domains\Fleet\Models\Document::with('documentable')
            ->where('is_archived', false)
            ->where('status', 'Verified')
            ->whereNotNull('expiry_date')
            ->get();

        $adminEmails = \App\Domains\Identity\Models\User::whereIn('role', ['admin', 'superadmin', 'super_admin'])->pluck('email')->toArray();

        foreach ($documents as $doc) {
            $daysRemaining = \Carbon\Carbon::now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($doc->expiry_date)->startOfDay(), false);

            if (in_array($daysRemaining, [30, 14, 1])) {
                $docName = 'Unknown Entity';
                $driverEmail = null;

                if ($doc->documentable_type === \App\Domains\Fleet\Models\Vehicle::class && $doc->documentable) {
                    $docName = "Vehicle: " . $doc->documentable->make . ' ' . $doc->documentable->model . ' (' . $doc->documentable->license_plate . ')';
                } elseif ($doc->documentable_type === \App\Domains\Driver\Models\Driver::class && $doc->documentable && $doc->documentable->user) {
                    $docName = "Driver: " . $doc->documentable->user->name;
                    $driverEmail = $doc->documentable->user->email;
                }

                $documentData = [
                    'entity_name' => $docName,
                    'document_type' => $doc->document_type,
                    'expiry_date' => \Carbon\Carbon::parse($doc->expiry_date)->format('Y-m-d'),
                    'days_remaining' => $daysRemaining,
                ];

                $emails = $adminEmails;
                if ($driverEmail && !in_array($driverEmail, $emails)) {
                    $emails[] = $driverEmail;
                }

                if (!empty($emails)) {
                    \Illuminate\Support\Facades\Mail::to($emails)->send(new \App\Mail\DocumentExpiring($documentData));
                    $this->info("Sent expiration notice for {$docName} - {$doc->document_type} ({$daysRemaining} days remaining)");
                }
            }
        }

        $this->info('Document expiry check completed.');
    }
}
