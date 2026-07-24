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
Route::post('/dashboard/vehicles/import', [\App\Http\Controllers\DashboardController::class, 'importVehicles'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles.import');
Route::delete('/dashboard/vehicles/{vehicle}', [\App\Http\Controllers\DashboardController::class, 'destroyVehicle'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles.destroy');

Route::post('/dashboard/trips', [\App\Http\Controllers\DashboardController::class, 'storeTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.store');
Route::put('/dashboard/trips/{trip}/end', [\App\Http\Controllers\DashboardController::class, 'endTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.end');
Route::delete('/dashboard/trips/{trip}', [\App\Http\Controllers\DashboardController::class, 'destroyTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.destroy');

Route::get('/dashboard/maintenance', [\App\Http\Controllers\DashboardController::class, 'maintenances'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance');
Route::post('/dashboard/maintenance', [\App\Http\Controllers\DashboardController::class, 'storeMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.store');
Route::post('/dashboard/maintenance/{maintenance}/action', [\App\Http\Controllers\DashboardController::class, 'actionMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.action');
Route::post('/dashboard/maintenance/import', [\App\Http\Controllers\DashboardController::class, 'importMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.import');

Route::get('/dashboard/fuel', [\App\Http\Controllers\DashboardController::class, 'fuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel');
Route::post('/dashboard/fuel', [\App\Http\Controllers\DashboardController::class, 'storeFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.store');
Route::post('/dashboard/fuel/{fuelLog}/action', [\App\Http\Controllers\DashboardController::class, 'actionFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.action');
Route::post('/dashboard/fuel/import', [\App\Http\Controllers\DashboardController::class, 'importFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.import');

Route::get('/dashboard/compliance', [\App\Http\Controllers\DashboardController::class, 'compliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance');
Route::post('/dashboard/compliance', [\App\Http\Controllers\DashboardController::class, 'storeCompliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance.store');
Route::post('/dashboard/compliance/import', [\App\Http\Controllers\DashboardController::class, 'importCompliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance.import');

Route::get('/dashboard/drivers', [\App\Http\Controllers\DashboardController::class, 'drivers'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers');
Route::post('/dashboard/drivers', [\App\Http\Controllers\DashboardController::class, 'storeDriver'])
    ->middleware(['auth', 'verified']);
Route::post('/dashboard/drivers/import', [\App\Http\Controllers\DashboardController::class, 'importDrivers'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers.import');
Route::delete('/dashboard/drivers/{driver}', [\App\Http\Controllers\DashboardController::class, 'destroyDriver'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers.destroy');

Route::get('/dashboard/reports', [\App\Http\Controllers\DashboardController::class, 'reports'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.reports');

Route::get('/dashboard/fleet/locations', [\App\Http\Controllers\Api\TelematicsController::class, 'latestLocations'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fleet.locations');

Route::get('/dashboard/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.notifications');
Route::post('/dashboard/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.notifications.markAllAsRead');
Route::post('/dashboard/notifications/{id}/mark-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.notifications.markAsRead');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/settings', [ProfileController::class, 'updateSettings'])
        ->middleware('role:superadmin,admin,manager')
        ->name('settings.update');
});

require __DIR__.'/auth.php';
