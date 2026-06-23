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
            'locations' => function($query) {
                $query->latest()->limit(1);
            },
            'trips' => function($query) {
                $query->whereNull('end_time')->latest()->limit(1)->with('driver.user');
            }
        ])->get()->map(function($vehicle) {
            $latestLocation = $vehicle->locations->first();
            $activeTrip = $vehicle->trips->first();
            
            return [
                'id' => $vehicle->id,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'license_plate' => $vehicle->license_plate,
                'latitude' => $latestLocation ? $latestLocation->latitude : 39.8283, // Default US
                'longitude' => $latestLocation ? $latestLocation->longitude : -98.5795,
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
        $vehicles = Vehicle::latest()->get();
        return Inertia::render('Dashboard/Vehicles', [
            'vehicles' => $vehicles
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
}
