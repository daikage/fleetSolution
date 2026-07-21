<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class RequestActioned extends Notification
{
    use Queueable;

    public $requestModel;
    public $requestType;

    /**
     * Create a new notification instance.
     */
    public function __construct($requestModel, $requestType)
    {
        $this->requestModel = $requestModel;
        $this->requestType = $requestType; // 'Maintenance' or 'Fuel'
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => "Your {$this->requestType} Request was {$this->requestModel->status}.",
            'status' => $this->requestModel->status,
            'comment' => $this->requestModel->reviewer_comment,
            'request_id' => $this->requestModel->id,
            'request_type' => $this->requestType,
            'url' => $this->requestType === 'Maintenance' ? '/dashboard/maintenance' : '/dashboard/fuel',
        ];
    }
}
