<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class ForceStartTracking extends Notification implements ShouldQueue
{
    use Queueable;

    public $driver;

    /**
     * Create a new notification instance.
     */
    public function __construct($driver)
    {
        $this->driver = $driver;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => 'ForceStartTracking',
            'driver_id' => $this->driver->id,
            'user_id' => $this->driver->user_id,
            'driver_name' => $this->driver->user->name,
            'message' => "Fleet manager has requested you to start tracking. Please open the app and tap Start Tracking.",
            'created_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'driver_id' => $this->driver->id,
            'user_id' => $this->driver->user_id,
            'driver_name' => $this->driver->user->name,
            'message' => "Fleet manager has requested you to start tracking. Please open the app and tap Start Tracking.",
            'created_at' => now()->toIso8601String(),
        ];
    }
}