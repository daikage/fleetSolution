<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('fleet', function ($user) {
    return $user->role !== 'driver';
});

Broadcast::channel('conversation.{id}', function ($user, $id) {
    return $user->conversations()->where('conversations.id', $id)->exists();
});
