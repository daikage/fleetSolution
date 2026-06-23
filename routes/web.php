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
