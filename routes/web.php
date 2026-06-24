<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('/dashboard/vehicles', [\App\Http\Controllers\DashboardController::class, 'vehicles'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles');
Route::post('/dashboard/vehicles', [\App\Http\Controllers\DashboardController::class, 'storeVehicle'])
    ->middleware(['auth', 'verified']);
Route::delete('/dashboard/vehicles/{vehicle}', [\App\Http\Controllers\DashboardController::class, 'destroyVehicle'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles.destroy');

Route::post('/dashboard/trips', [\App\Http\Controllers\DashboardController::class, 'storeTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.store');
Route::put('/dashboard/trips/{trip}/end', [\App\Http\Controllers\DashboardController::class, 'endTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.end');

Route::get('/dashboard/maintenance', [\App\Http\Controllers\DashboardController::class, 'maintenances'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance');
Route::post('/dashboard/maintenance', [\App\Http\Controllers\DashboardController::class, 'storeMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.store');

Route::get('/dashboard/fuel', [\App\Http\Controllers\DashboardController::class, 'fuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel');
Route::post('/dashboard/fuel', [\App\Http\Controllers\DashboardController::class, 'storeFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.store');

Route::get('/dashboard/compliance', [\App\Http\Controllers\DashboardController::class, 'compliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance');
Route::post('/dashboard/compliance', [\App\Http\Controllers\DashboardController::class, 'storeCompliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance.store');

Route::get('/dashboard/drivers', [\App\Http\Controllers\DashboardController::class, 'drivers'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers');
Route::post('/dashboard/drivers', [\App\Http\Controllers\DashboardController::class, 'storeDriver'])
    ->middleware(['auth', 'verified']);
Route::delete('/dashboard/drivers/{driver}', [\App\Http\Controllers\DashboardController::class, 'destroyDriver'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers.destroy');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
