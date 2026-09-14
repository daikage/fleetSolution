<?php

namespace App\Console\Commands;

use App\Domains\Driver\Models\Driver;
use App\Domains\Fleet\Models\Document;
use App\Domains\Fleet\Models\Vehicle;
use App\Domains\Identity\Models\User;
use App\Mail\DocumentExpiring;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('app:check-document-expiries')]
#[Description('Check for compliance documents expiring in 30, 14, or 1 days and send email notifications.')]
class CheckDocumentExpiries extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $documents = Document::with('documentable')
            ->where('is_archived', false)
            ->where('status', 'Verified')
            ->whereNotNull('expiry_date')
            ->get();

        $adminEmails = User::whereIn('role', ['admin', 'superadmin', 'super_admin'])->pluck('email')->toArray();

        foreach ($documents as $doc) {
            $daysRemaining = Carbon::now()->startOfDay()->diffInDays(Carbon::parse($doc->expiry_date)->startOfDay(), false);

            if (in_array($daysRemaining, [30, 14, 1])) {
                $docName = 'Unknown Entity';
                $driverEmail = null;

                if ($doc->documentable_type === Vehicle::class && $doc->documentable) {
                    $docName = 'Vehicle: '.$doc->documentable->name.' ('.$doc->documentable->license_plate.')';
                } elseif ($doc->documentable_type === Driver::class && $doc->documentable && $doc->documentable->user) {
                    $docName = 'Driver: '.$doc->documentable->user->name;
                    $driverEmail = $doc->documentable->user->email;
                }

                $documentData = [
                    'entity_name' => $docName,
                    'document_type' => $doc->document_type,
                    'expiry_date' => Carbon::parse($doc->expiry_date)->format('Y-m-d'),
                    'days_remaining' => $daysRemaining,
                ];

                $emails = $adminEmails;
                if ($driverEmail && ! in_array($driverEmail, $emails)) {
                    $emails[] = $driverEmail;
                }

                if (! empty($emails)) {
                    Mail::to($emails)->send(new DocumentExpiring($documentData));
                    $this->info("Sent expiration notice for {$docName} - {$doc->document_type} ({$daysRemaining} days remaining)");
                }
            }
        }

        $this->info('Document expiry check completed.');
    }
}
