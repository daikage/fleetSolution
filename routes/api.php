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
    if (! $user || ! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }
    
    if ($user->role !== 'driver') {
        return response()->json(['message' => 'Unauthorized: Only drivers can login here.'], 403);
    }
    
    $driver = \App\Models\Driver::where('user_id', $user->id)->first();
    $trip = \App\Models\Trip::where('driver_id', $driver->id)->whereNull('end_time')->latest()->first();
    $vehicleId = $trip ? $trip->vehicle_id : null;

    $token = $user->createToken('mobile-app')->plainTextToken;
    
    return response()->json([
        'token' => $token, 
        'user' => $user, 
        'driver' => $driver, 
        'vehicle_id' => $vehicleId
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/telematics/location', [\App\Http\Controllers\Api\TelematicsController::class, 'store']);

    // Admin/Manager Settings routes
    Route::middleware('role:superadmin,admin,manager')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
        Route::post('/settings', [\App\Http\Controllers\Api\SettingsController::class, 'update']);
    });
});

// OsmAnd / Generic GET tracker route
// Usually GET based trackers use standard API tokens via query string or header, 
// for simplicity we'll protect this with a custom middleware or just Sanctum (if app supports headers).
Route::middleware('auth:sanctum')->get('/telematics/osmand', [\App\Http\Controllers\Api\TelematicsController::class, 'storeOsmAnd']);
