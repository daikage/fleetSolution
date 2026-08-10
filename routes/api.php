<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Identity Domain
use App\Domains\Identity\Controllers\AuthController;

// Telematics Domain
use App\Domains\Telematics\Controllers\TelematicsController;

// Communication Domain
use App\Domains\Communication\Controllers\PushNotificationController;
use App\Domains\Communication\Controllers\ChatController;

// Driver Domain
use App\Domains\Driver\Controllers\DriverTrackingController;

Route::get('/user', function (Request $request) {
    return $request->user()->only(['id', 'name', 'email', 'role']);
})->middleware('auth:sanctum');

Route::post('/mobile/login', [AuthController::class, 'mobileLogin'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/telematics/location', [TelematicsController::class, 'store']);
    Route::get('/fleet/vehicles/locations', [TelematicsController::class, 'latestLocations'])
        ->middleware('can:view-vehicles');

    // Force-start push notification - admin/superadmin only
    Route::post('/push/force-start', [PushNotificationController::class, 'forceStart']);
    Route::post('/push/register-token', [PushNotificationController::class, 'registerToken']);

    // Driver tracking enforcement
    Route::get('/driver/should-track', [DriverTrackingController::class, 'shouldTrack']);
    Route::post('/driver/report-status', [DriverTrackingController::class, 'reportStatus']);
    Route::post('/driver/auto-ping', [DriverTrackingController::class, 'autoPing']);

    // Driver app: check for active trip assignment
    Route::get('/driver/active-trip', [DriverTrackingController::class, 'activeTrip']);

    // Chat system
    Route::get('/chat/users', [ChatController::class, 'users']);
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/conversations/{conversation}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
    Route::post('/chat/users/{otherUser}', [ChatController::class, 'getOrCreateConversation']);
});

// OsmAnd tracker — uses shared secret in query param for auth
Route::get('/telematics/osmand', [TelematicsController::class, 'storeOsmAnd']);