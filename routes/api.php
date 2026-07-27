<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/mobile/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = \App\Models\User::where('email', $request->email)->first();
    if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    if ($user->role !== 'driver') {
        return response()->json(['message' => 'Unauthorized: Only drivers can login here.'], 403);
    }

    $driver = \App\Models\Driver::where('user_id', $user->id)->first();
    if (!$driver) {
        return response()->json(['message' => 'Driver profile not found for this user.'], 404);
    }
    $trip = \App\Models\Trip::where('driver_id', $driver->id)->whereNull('end_time')->latest()->first();
    $vehicleId = $trip ? $trip->vehicle_id : null;

    $token = $user->createToken('mobile-app')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user,
        'driver' => $driver,
        'vehicle_id' => $vehicleId,
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/telematics/location', [\App\Http\Controllers\Api\TelematicsController::class, 'store']);
    Route::get('/fleet/vehicles/locations', [\App\Http\Controllers\Api\TelematicsController::class, 'latestLocations']);

    // Force-start push notification
    Route::post('/push/force-start', [\App\Http\Controllers\Api\PushNotificationController::class, 'forceStart']);
    Route::post('/push/register-token', [\App\Http\Controllers\Api\PushNotificationController::class, 'registerToken']);

    // Driver tracking enforcement
    Route::get('/driver/should-track', [\App\Http\Controllers\Api\DriverTrackingController::class, 'shouldTrack']);
    Route::post('/driver/report-status', [\App\Http\Controllers\Api\DriverTrackingController::class, 'reportStatus']);
    Route::post('/driver/auto-ping', [\App\Http\Controllers\Api\DriverTrackingController::class, 'autoPing']);

    // Driver app: check for active trip assignment
    Route::get('/driver/active-trip', function (Request $request) {
        $user = $request->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)->first();
        if (!$driver) {
            return response()->json(['vehicle_id' => null, 'trip_id' => null]);
        }
        $trip = \App\Models\Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->latest()
            ->first();
        return response()->json([
            'vehicle_id' => $trip ? $trip->vehicle_id : null,
            'trip_id' => $trip ? $trip->id : null,
        ]);
    });
});

// OsmAnd / Generic GET tracker route — unprotected, uses vehicle_id as identifier
Route::get('/telematics/osmand', [\App\Http\Controllers\Api\TelematicsController::class, 'storeOsmAnd']);