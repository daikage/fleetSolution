<?php

namespace App\Domains\Communication\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Communication\Models\Conversation;
use App\Domains\Communication\Models\Message;
use App\Domains\Identity\Models\User;
use App\Events\MessageSent;
use App\Notifications\NewChatMessageNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    /**
     * Get list of users the authenticated user can chat with.
     */
    public function users(Request $request)
    {
        $user = $request->user();

        // If driver, they can chat with managers and other drivers.
        // If manager, they can chat with drivers.
        
        $query = User::query()->where('id', '!=', $user->id);

        if ($user->role === 'driver') {
            $query->whereIn('role', ['driver', 'manager']);
        } elseif ($user->role === 'manager') {
            $query->whereIn('role', ['driver', 'manager']); // Let managers also chat with managers if needed, or just drivers.
        }

        $users = $query->select('id', 'name', 'role')->get();

        return response()->json($users);
    }

    /**
     * Get conversations for the current user.
     */
    public function conversations(Request $request)
    {
        $conversations = $request->user()->conversations()
            ->with(['users:id,name,role', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->latest('updated_at')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Get or create a 1-on-1 conversation with a specific user.
     */
    public function getOrCreateConversation(Request $request, User $otherUser)
    {
        $user = $request->user();

        // Check if a 1-on-1 conversation already exists
        $conversation = $user->conversations()
            ->where('is_group', false)
            ->whereHas('users', function ($query) use ($otherUser) {
                $query->where('users.id', $otherUser->id);
            })
            ->first();

        if (!$conversation) {
            DB::transaction(function () use ($user, $otherUser, &$conversation) {
                $conversation = Conversation::create(['is_group' => false]);
                $conversation->users()->attach([$user->id, $otherUser->id]);
            });
        }

        return response()->json($conversation->load('users:id,name,role'));
    }

    /**
     * Get messages for a conversation.
     */
    public function messages(Request $request, Conversation $conversation)
    {
        // Ensure user is part of the conversation
        if (!$conversation->users()->where('users.id', $request->user()->id)->exists()) {
            abort(403);
        }

        $messages = $conversation->messages()->with('sender:id,name')->oldest()->get();
        return response()->json($messages);
    }

    /**
     * Send a message to a conversation (text and/or image).
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $request->validate([
            'content' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:10240', // 10MB max
        ]);

        // At least one of content or image must be present
        if (!$request->input('content') && !$request->hasFile('image')) {
            return response()->json(['message' => 'A message must contain text or an image.'], 422);
        }

        $user = $request->user();

        if (!$conversation->users()->where('users.id', $user->id)->exists()) {
            abort(403);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('chat-images', 'public');
        }

        $message = $conversation->messages()->create([
            'sender_id' => $user->id,
            'content' => $request->input('content', ''),
            'image_path' => $imagePath,
        ]);

        $conversation->touch(); // Update updated_at for ordering

        // Load sender for broadcast
        $message->load('sender:id,name');

        // Broadcast to other users in the conversation
        broadcast(new MessageSent($message, $conversation))->toOthers();

        // Send push notification to offline users
        $otherUsers = $conversation->users()->where('users.id', '!=', $user->id)->get();
        
        $pushMessages = [];
        foreach ($otherUsers as $otherUser) {
            // Create database notification for dashboard users (managers/admins)
            if (in_array($otherUser->role, ['manager', 'admin', 'superadmin', 'super_admin'])) {
                $otherUser->notify(new NewChatMessageNotification($message, $conversation));
            }

            if ($otherUser->push_token) {
                $pushMessages[] = [
                    'to' => $otherUser->push_token,
                    'title' => 'New message from ' . $user->name,
                    'body' => $imagePath ? ($message->content ?: '📷 Image') : $message->content,
                    'sound' => 'notification.mp3',
                    'channelId' => 'chat-messages',
                    'data' => [
                        'conversation_id' => $conversation->id,
                        'sender_id' => $user->id,
                        'sender_name' => $user->name,
                        'type' => 'chat_message'
                    ],
                ];
            }
        }

        if (!empty($pushMessages)) {
            try {
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])->post('https://exp.host/--/api/v2/push/send', $pushMessages);

                if (!$response->successful()) {
                    \Illuminate\Support\Facades\Log::error('Expo Push API Error: ' . $response->body());
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send Expo push notification: ' . $e->getMessage());
            }
        }

        return response()->json($message);
    }
}
