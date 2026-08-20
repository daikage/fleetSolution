<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceForwarded extends Mailable
{
    use Queueable, SerializesModels;

    public $record;
    public $recordType; // 'Maintenance' or 'Fuel'
    public $senderName;

    /**
     * Create a new message instance.
     */
    public function __construct($record, string $recordType, string $senderName)
    {
        $this->record = $record;
        $this->recordType = $recordType;
        $this->senderName = $senderName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->recordType === 'Maintenance'
            ? "Invoice — Maintenance Request #{$this->record->id}"
            : "Invoice — Fuel Request #{$this->record->id}";

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice-forwarded',
        );
    }
}
