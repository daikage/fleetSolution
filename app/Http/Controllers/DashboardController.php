<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Vehicle;

class DashboardController extends Controller
{
    public function index()
    {
        // Get all vehicles with their latest location and active trip driver
        $vehicles = Vehicle::with([
            'latestLocation',
            'currentTrip.driver.user'
        ])->get()->map(function($vehicle) {
            $latestLocation = $vehicle->latestLocation;
            $activeTrip = $vehicle->currentTrip;
            
            return [
                'id' => $vehicle->id,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'license_plate' => $vehicle->license_plate,
                'latitude' => $latestLocation ? $latestLocation->latitude : 6.5244, // Default Lagos
                'longitude' => $latestLocation ? $latestLocation->longitude : 3.3792,
                'speed' => $latestLocation ? $latestLocation->speed : 0,
                'active_driver' => $activeTrip && $activeTrip->driver && $activeTrip->driver->user 
                    ? $activeTrip->driver->user->name 
                    : null,
            ];
        });

        return Inertia::render('Dashboard/Index', [
            'initialVehicles' => $vehicles,
        ]);
    }

    public function vehicles()
    {
        $vehicles = Vehicle::with(['currentTrip.driver.user'])->latest()->get();
        
        $drivers = \App\Models\Driver::with('user')->get();

        return Inertia::render('Dashboard/Vehicles', [
            'vehicles' => $vehicles,
            'drivers' => $drivers
        ]);
    }

    public function storeVehicle(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'year' => 'required|integer|min:1900|max:2100',
            'vin' => 'required|string|unique:vehicles|max:255',
            'license_plate' => 'required|string|unique:vehicles|max:255',
            'odometer' => 'required|numeric|min:0',
        ]);

        $validated['status'] = 'active';

        Vehicle::create($validated);

        return back();
    }

    public function drivers()
    {
        $drivers = \App\Models\Driver::with('user')->latest()->get();
        return Inertia::render('Dashboard/Drivers', [
            'drivers' => $drivers
        ]);
    }

    public function storeDriver(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'license_no' => 'required|string|unique:drivers|max:255',
            'license_exp' => 'required|date',
        ]);

        // Create the user account for the driver
        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => 'driver',
        ]);

        // Create the driver profile linked to the user
        \App\Models\Driver::create([
            'user_id' => $user->id,
            'license_no' => $validated['license_no'],
            'license_exp' => $validated['license_exp'],
        ]);

        return back();
    }

    public function destroyVehicle(Vehicle $vehicle)
    {
        $vehicle->delete();
        return back();
    }

    public function destroyDriver(\App\Models\Driver $driver)
    {
        // This will cascade delete the user if constraints are set up, 
        // but let's explicitly delete the User account since the driver is bound to it.
        $user = $driver->user;
        $driver->delete();
        if ($user) {
            $user->delete();
        }
        
        return back();
    }

    public function storeTrip(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
        ]);

        \App\Models\Trip::create([
            'vehicle_id' => $validated['vehicle_id'],
            'driver_id' => $validated['driver_id'],
            'start_time' => now(),
        ]);

        return back();
    }

    public function endTrip(\App\Models\Trip $trip)
    {
        $trip->update([
            'end_time' => now(),
        ]);

        return back();
    }

    public function maintenances()
    {
        $maintenances = \App\Models\Maintenance::with('vehicle')->latest()->get();
        $vehicles = Vehicle::latest()->get();

        return Inertia::render('Dashboard/Maintenance', [
            'maintenances' => $maintenances,
            'vehicles' => $vehicles
        ]);
    }

    public function storeMaintenance(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'service_type' => 'required|string|max:255',
            'cost' => 'required|numeric|min:0',
            'date' => 'required|date',
        ]);

        \App\Models\Maintenance::create($validated);

        return back();
    }
}
