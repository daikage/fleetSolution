<?php

use App\Domains\Fleet\Models\Vehicle;
use App\Domains\Identity\Controllers\TwoFactorController;
use App\Domains\Telematics\Controllers\TelematicsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SessionController;
use App\Jobs\ProcessVehicleLocation;
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

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('/dashboard/vehicles', [DashboardController::class, 'vehicles'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles');

Route::get('/fix-map', function () {
    $vehicles = Vehicle::all();
    $updated = 0;
    foreach ($vehicles as $vehicle) {
        $baseLoc = strtolower(trim($vehicle->base_location ?? ''));
        if (str_contains($baseLoc, 'lagos')) {
            $lat = 6.574368986524661;
            $lng = 3.3891698249000393;
        } elseif (str_contains($baseLoc, 'abuja')) {
            $lat = 9.018317344473623;
            $lng = 7.456211478382267;
        } elseif (str_contains($baseLoc, 'ibadan')) {
            $lat = 7.3775;
            $lng = 3.9470;
        } else {
            // Default to Lagos
            $lat = 6.574368986524661;
            $lng = 3.3891698249000393;
        }
        $vehicle->update(['latitude' => $lat, 'longitude' => $lng]);

        // Register location so the map picks it up
        ProcessVehicleLocation::dispatch($vehicle->id, $lat, $lng, 0);
        $updated++;
    }

    return 'Fixed and stacked '.$updated.' vehicles onto the exact office coordinates. You can now go back to the dashboard.';
});
Route::post('/dashboard/vehicles', [DashboardController::class, 'storeVehicle'])
    ->middleware(['auth', 'verified']);
Route::put('/dashboard/vehicles/{vehicle}', [DashboardController::class, 'updateVehicle'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles.update');
Route::post('/dashboard/vehicles/{vehicle}/location', [DashboardController::class, 'updateVehicleLocation'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles.location');
Route::post('/dashboard/vehicles/import', [DashboardController::class, 'importVehicles'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles.import');
Route::delete('/dashboard/vehicles/{vehicle}', [DashboardController::class, 'destroyVehicle'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vehicles.destroy');

Route::post('/dashboard/trips', [DashboardController::class, 'storeTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.store');
Route::put('/dashboard/trips/{trip}/end', [DashboardController::class, 'endTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.end');

Route::delete('/dashboard/trips/{trip}', [DashboardController::class, 'destroyTrip'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips.destroy');

Route::get('/dashboard/maintenance', [DashboardController::class, 'maintenances'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance');
Route::post('/dashboard/maintenance', [DashboardController::class, 'storeMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.store');
Route::post('/dashboard/maintenance/{maintenance}/action', [DashboardController::class, 'actionMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.action');
Route::post('/dashboard/maintenance/{maintenance}/resubmit', [DashboardController::class, 'resubmitMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.resubmit');
Route::post('/dashboard/maintenance/import', [DashboardController::class, 'importMaintenance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.maintenance.import');

Route::get('/dashboard/fuel', [DashboardController::class, 'fuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel');
Route::post('/dashboard/fuel', [DashboardController::class, 'storeFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.store');
Route::post('/dashboard/fuel/{fuelLog}/action', [DashboardController::class, 'actionFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.action');
Route::post('/dashboard/fuel/{fuelLog}/resubmit', [DashboardController::class, 'resubmitFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.resubmit');
Route::post('/dashboard/fuel/import', [DashboardController::class, 'importFuel'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fuel.import');

Route::get('/dashboard/compliance', [DashboardController::class, 'compliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance');
Route::post('/dashboard/compliance', [DashboardController::class, 'storeCompliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance.store');
Route::post('/dashboard/compliance/import', [DashboardController::class, 'importCompliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance.import');
Route::post('/dashboard/compliance/{document}/action', [DashboardController::class, 'actionCompliance'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.compliance.action');

Route::get('/dashboard/drivers', [DashboardController::class, 'drivers'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers');
Route::post('/dashboard/drivers', [DashboardController::class, 'storeDriver'])
    ->middleware(['auth', 'verified']);
Route::post('/dashboard/drivers/import', [DashboardController::class, 'importDrivers'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers.import');
Route::delete('/dashboard/drivers/{driver}', [DashboardController::class, 'destroyDriver'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.drivers.destroy');

Route::get('/dashboard/trips', [DashboardController::class, 'trips'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.trips');

Route::get('/dashboard/reports', [DashboardController::class, 'reports'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.reports');

Route::get('/dashboard/financial-reports', [DashboardController::class, 'financialReports'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.financial-reports');

Route::get('/dashboard/approval-desk', [DashboardController::class, 'approvalDesk'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.approval-desk');
Route::post('/dashboard/approval-desk/{type}/{id}/send-invoice', [DashboardController::class, 'sendInvoiceEmail'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.approval-desk.send-invoice');

Route::get('/dashboard/users', [DashboardController::class, 'users'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.users');
Route::put('/dashboard/users/{user}', [DashboardController::class, 'updateUser'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.users.update');
Route::post('/dashboard/users/{user}/revoke-devices', [SessionController::class, 'revokeDevices'])
    ->middleware(['auth', 'verified', 'role:superadmin,admin'])
    ->name('dashboard.users.revoke-devices');

Route::get('/dashboard/vendors', [DashboardController::class, 'vendors'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vendors');
Route::post('/dashboard/vendors', [DashboardController::class, 'storeVendor'])
    ->middleware(['auth', 'verified']);
Route::put('/dashboard/vendors/{vendor}', [DashboardController::class, 'updateVendor'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vendors.update');
Route::delete('/dashboard/vendors/{vendor}', [DashboardController::class, 'destroyVendor'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.vendors.destroy');

Route::get('/dashboard/departments', [DashboardController::class, 'departments'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.departments');
Route::post('/dashboard/departments', [DashboardController::class, 'storeDepartment'])
    ->middleware(['auth', 'verified']);
Route::put('/dashboard/departments/{department}', [DashboardController::class, 'updateDepartment'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.departments.update');
Route::delete('/dashboard/departments/{department}', [DashboardController::class, 'destroyDepartment'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.departments.destroy');

Route::get('/dashboard/fleet/locations', [TelematicsController::class, 'latestLocations'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.fleet.locations');

// Secure file serving route — redirects to temporary signed URLs
Route::get('/files/{disk}/{path}', [FileController::class, 'show'])
    ->middleware(['auth', 'verified'])
    ->where('path', '.*')
    ->name('files.show');

Route::get('/dashboard/notifications', [NotificationController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.notifications');
Route::post('/dashboard/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.notifications.markAllAsRead');
Route::post('/dashboard/notifications/{id}/mark-read', [NotificationController::class, 'markAsRead'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.notifications.markAsRead');

Route::get('/dashboard/chat', function () {
    return Inertia::render('Dashboard/Chat');
})->middleware(['auth', 'verified'])->name('dashboard.chat');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/settings', [ProfileController::class, 'updateSettings'])
        ->middleware('role:superadmin,admin,manager')
        ->name('settings.update');

    // 2FA Management Routes
    Route::post('/user/two-factor-authentication', [TwoFactorController::class, 'enable'])
        ->name('two-factor.enable');
    Route::post('/user/confirmed-two-factor-authentication', [TwoFactorController::class, 'confirm'])
        ->name('two-factor.confirm');
    Route::delete('/user/two-factor-authentication', [TwoFactorController::class, 'disable'])
        ->name('two-factor.disable');
});

// 2FA Challenge Routes (Guest or Partial Login)
Route::get('/two-factor-challenge', [TwoFactorController::class, 'challenge'])
    ->name('two-factor.challenge');
Route::post('/two-factor-challenge', [TwoFactorController::class, 'verify'])
    ->name('two-factor.verify');

require __DIR__.'/auth.php';
