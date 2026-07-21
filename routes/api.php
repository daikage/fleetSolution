<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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
