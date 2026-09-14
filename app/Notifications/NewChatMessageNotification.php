<?php

namespace App\Notifications;

use App\Domains\Communication\Models\Conversation;
use App\Domains\Communication\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewChatMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $message;

    public $conversation;

    /**
     * Create a new notification instance.
     */
    public function __construct(Message $message, Conversation $conversation)
    {
        $this->message = $message;
        $this->conversation = $conversation;
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
            'message' => "You have a new message from {$this->message->sender->name}.",
            'conversation_id' => $this->conversation->id,
            'sender_name' => $this->message->sender->name,
            'url' => '/dashboard/chat?conversation='.$this->conversation->id,
            'type' => 'chat_message',
        ];
    }
}
