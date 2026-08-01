<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ReviewRequestForwarded extends Notification
{
    use Queueable;

    public $requestModel;
    public $requestType;
    public $adminName;

    /**
     * Create a new notification instance.
     */
    public function __construct($requestModel, $requestType, $adminName)
    {
        $this->requestModel = $requestModel;
        $this->requestType = $requestType; // 'Maintenance' or 'Fuel'
        $this->adminName = $adminName;
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
            'message' => "Admin {$this->adminName} has forwarded a {$this->requestType} request (₦" . number_format($this->requestModel->cost, 2) . ") for your review.",
            'cost' => $this->requestModel->cost,
            'admin_name' => $this->adminName,
            'request_id' => $this->requestModel->id,
            'request_type' => $this->requestType,
            'url' => $this->requestType === 'Maintenance' ? '/dashboard/maintenance' : '/dashboard/fuel',
        ];
    }
}
