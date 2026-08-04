<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
     * Send a message to a conversation.
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $user = $request->user();

        if (!$conversation->users()->where('users.id', $user->id)->exists()) {
            abort(403);
        }

        $message = $conversation->messages()->create([
            'sender_id' => $user->id,
            'content' => $request->input('content'),
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
            if ($otherUser->role === 'driver' && $otherUser->driver && $otherUser->driver->push_token) {
                $pushMessages[] = [
                    'to' => $otherUser->driver->push_token,
                    'title' => 'New message from ' . $user->name,
                    'body' => $message->content,
                    'data' => ['conversation_id' => $conversation->id],
                ];
            }
        }

        if (!empty($pushMessages)) {
            try {
                \Illuminate\Support\Facades\Http::post('https://exp.host/--/api/v2/push/send', $pushMessages);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send Expo push notification: ' . $e->getMessage());
            }
        }

        return response()->json($message);
    }
}
