<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Vehicle;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\MaintenanceRequestDecision;
use App\Mail\FuelRequestDecision;

class DashboardController extends Controller
{
    public function index()
    {
        if (auth()->user()->role === 'driver') {
            return redirect()->route('dashboard.maintenance');
        }

        // Get all vehicles with their latest location and active trip driver
        // Use vehicle's registered lat/lng as fallback when no GPS ping exists yet
        $vehicles = Vehicle::with([
            'latestLocation',
            'currentTrip.driver.user'
        ])->get()->map(function ($vehicle) {
            $latestLocation = $vehicle->latestLocation;
            $activeTrip = $vehicle->currentTrip;

            // Priority: GPS ping → vehicle registered location
            $latitude = $latestLocation?->latitude ?? $vehicle->latitude;
            $longitude = $latestLocation?->longitude ?? $vehicle->longitude;

            // Only include vehicles that have a meaningful location
            // Vehicles with no GPS data and no registered location will show
            // as NULL — the FleetMap component will skip them automatically
            return [
                'id' => $vehicle->id,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'license_plate' => $vehicle->license_plate,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'speed' => $latestLocation ? $latestLocation->speed : 0,
                'active_driver' => $activeTrip && $activeTrip->driver && $activeTrip->driver->user
                    ? $activeTrip->driver->user->name
                    : null,
                'trip_id' => $activeTrip ? $activeTrip->id : null,
                'currentTrip' => $activeTrip ? [
                    'id' => $activeTrip->id,
                    'driver' => $activeTrip->driver ? [
                        'id' => $activeTrip->driver->id,
                    ] : null,
                ] : null,
            ];
        });

        // Expiry alerts logic
        $upcomingExpiries = \App\Models\Document::with('documentable')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays(30)->format('Y-m-d'))
            ->get()->map(function ($doc) {
                $docName = 'Unknown';
                if ($doc->documentable_type === \App\Models\Vehicle::class && $doc->documentable) {
                    $docName = $doc->documentable->make . ' ' . $doc->documentable->model . ' (' . $doc->documentable->license_plate . ')';
                } elseif ($doc->documentable_type === \App\Models\Driver::class && $doc->documentable && $doc->documentable->user) {
                    $docName = $doc->documentable->user->name;
                }
                return [
                    'id' => $doc->id,
                    'type' => $doc->document_type,
                    'entity' => $docName,
                    'expiry_date' => $doc->expiry_date,
                    'is_expired' => \Carbon\Carbon::parse($doc->expiry_date)->isPast()
                ];
            });

        return Inertia::render('Dashboard/Index', [
            'initialVehicles' => $vehicles,
            'upcomingExpiries' => $upcomingExpiries,
        ]);
    }

    public function vehicles()
    {
        if (auth()->user()->role === 'driver') {
            abort(403, 'Unauthorized access.');
        }

        $vehicles = Vehicle::with(['currentTrip.driver.user', 'documents'])->latest()->get();

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
            'vendor' => 'nullable|string|max:255',
            'driver_id' => 'nullable|exists:drivers,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $validated['status'] = 'active';

        $vehicle = Vehicle::create([
            'make' => $validated['make'],
            'model' => $validated['model'],
            'year' => $validated['year'],
            'vin' => $validated['vin'],
            'license_plate' => $validated['license_plate'],
            'odometer' => $validated['odometer'],
            'vendor' => $validated['vendor'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'status' => $validated['status'],
        ]);

        if (!empty($validated['driver_id'])) {
            \App\Models\Trip::create([
                'vehicle_id' => $vehicle->id,
                'driver_id' => $validated['driver_id'],
                'start_time' => now(),
            ]);
        }

        return back();
    }

    public function drivers()
    {
        if (auth()->user()->role === 'driver') {
            abort(403, 'Unauthorized access.');
        }

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
            'passport_photo' => 'nullable|image|max:2048',
        ]);

        $passportPath = null;
        if ($request->hasFile('passport_photo')) {
            $passportPath = $request->file('passport_photo')->store('passports', 'public');
        }

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
            'passport_photo' => $passportPath ? '/storage/' . $passportPath : null,
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
            'start_odometer' => 'nullable|numeric|min:0',
            'start_location' => 'nullable|string|max:255',
        ]);

        \App\Models\Trip::create([
            'vehicle_id' => $validated['vehicle_id'],
            'driver_id' => $validated['driver_id'],
            'start_time' => now(),
            'start_odometer' => $validated['start_odometer'] ?? null,
            'start_location' => $validated['start_location'] ?? null,
            'status' => 'active',
        ]);

        return back();
    }

    public function endTrip(\Illuminate\Http\Request $request, $tripId)
    {
        try {
            \Log::info('endTrip called', ['tripId' => $tripId, 'user' => auth()->id()]);

            $trip = \App\Models\Trip::findOrFail($tripId);
            $trip->end_time = now();
            $trip->status = 'completed';
            $trip->save();

            \Log::info('endTrip success', ['trip_id' => $trip->id]);

            return redirect()->back();
        } catch (\Exception $e) {
            \Log::error('endTrip error', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroyTrip(\App\Models\Trip $trip)
    {
        $trip->delete();
        return back();
    }

    public function trips()
    {
        if (auth()->user()->role === 'driver') {
            abort(403, 'Unauthorized access.');
        }

        $query = \App\Models\Trip::with(['vehicle', 'driver.user'])->latest();

        // Filter by driver if provided
        if (request('driver_id')) {
            $query->where('driver_id', request('driver_id'));
        }

        // Filter by date range if provided
        if (request('start_date')) {
            $query->whereDate('start_time', '>=', request('start_date'));
        }
        if (request('end_date')) {
            $query->whereDate('start_time', '<=', request('end_date'));
        }

        $trips = $query->paginate(50);
        $drivers = \App\Models\Driver::with('user')->get();
        $vehicles = Vehicle::all();

        return Inertia::render('Dashboard/Trips', [
            'trips' => $trips,
            'drivers' => $drivers,
            'vehicles' => $vehicles,
            'filters' => request()->only(['driver_id', 'start_date', 'end_date']),
        ]);
    }

    public function maintenances()
    {
        $user = auth()->user();
        $query = \App\Models\Maintenance::with(['vehicle', 'assignedTo'])->latest();

        if ($user->role === 'admin') {
            $query->where('cost', '<=', 20000);
        } elseif ($user->role === 'superadmin') {
            $query->where('cost', '>', 20000);
        }

        $maintenances = $query->get();
        $vehicles = Vehicle::latest()->get();

        return Inertia::render('Dashboard/Maintenance', [
            'maintenances' => $maintenances,
            'vehicles' => $vehicles
        ]);
    }

    private function getAssigneeForCost($cost)
    {
        if ($cost <= 20000) {
            $user = \App\Models\User::where('role', 'admin')->first();
        } else {
            $user = \App\Models\User::where('role', 'superadmin')->first();
        }
        return $user ? $user->id : null;
    }

    public function storeMaintenance(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'type' => 'required|in:Regular Servicing,Repair',
            'service_type' => 'required|string|max:255',
            'diagnosis' => 'nullable|string',
            'work_to_be_done' => 'nullable|string',
            'vehicle_location' => 'nullable|string|max:255',
            'handled_by' => 'nullable|string|max:255',
            'supervised_by' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'vehicle_user' => 'nullable|string|max:255',
            'cost' => 'required|numeric|min:0',
            'date' => 'required|date',
        ]);

        $validated['status'] = 'Pending';
        $validated['assigned_to'] = $this->getAssigneeForCost($validated['cost']);
        $validated['created_by'] = auth()->id();

        $maintenance = \App\Models\Maintenance::create($validated);

        if ($maintenance->assignedTo) {
            $maintenance->assignedTo->notify(new \App\Notifications\RequestSubmitted($maintenance, 'Maintenance'));
        }

        return back();
    }

    public function actionMaintenance(\Illuminate\Http\Request $request, \App\Models\Maintenance $maintenance)
    {
        if (auth()->user()->role === 'manager') {
            abort(403, 'Managers cannot action requests.');
        }

        $userRole = auth()->user()->role;
        $isSuperAdmin = $userRole === 'superadmin' || $userRole === 'super_admin';
        $isAdmin = $userRole === 'admin';

        // Determine if this request needs superadmin approval
        $needsSuperAdmin = $maintenance->cost > 20000;

        // For admin approving low-cost requests directly
        if ($isAdmin && !$needsSuperAdmin) {
            $validated = $request->validate([
                'status' => 'required|in:Accepted,Rejected',
                'reviewer_comment' => 'nullable|string',
            ]);

            $maintenance->update([
                'status' => $validated['status'],
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            // Notify all relevant parties
            $this->notifyMaintenanceDecision($maintenance);

            return back();
        }

        // For superadmin approving/rejecting high-cost requests
        if ($isSuperAdmin && $needsSuperAdmin) {
            $validated = $request->validate([
                'status' => 'required|in:Accepted,Rejected',
                'reviewer_comment' => 'required|string',
            ]);

            $maintenance->update([
                'status' => $validated['status'],
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            // Notify all relevant parties
            $this->notifyMaintenanceDecision($maintenance);

            return back();
        }

        // Admin forwarding high-cost request to superadmin with comment
        if ($isAdmin && $needsSuperAdmin) {
            $validated = $request->validate([
                'reviewer_comment' => 'required|string',
            ]);

            // Change status to "Under Review" or keep as Pending but update comment
            $maintenance->update([
                'status' => 'Pending',
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            // Notify superadmin that review is needed
            $this->notifySuperAdminForReview($maintenance, 'Maintenance');

            return back();
        }

        abort(403, 'Unauthorized action.');
    }

    private function notifyMaintenanceDecision($maintenance)
    {
        // Notify the creator
        if ($maintenance->createdBy) {
            $maintenance->createdBy->notify(new \App\Notifications\RequestActioned($maintenance, 'Maintenance'));
        }

        // Notify the driver if possible
        $driver = $maintenance->vehicle->currentTrip?->driver ?? $maintenance->vehicle->trips()->latest()->first()?->driver;
        if ($driver && $driver->user) {
            Mail::to($driver->user->email)->send(new MaintenanceRequestDecision($maintenance));
        }

        // Notify the admin who processed it (if superadmin is acting)
        if (auth()->user()->role === 'superadmin' || auth()->user()->role === 'super_admin') {
            $admin = $maintenance->assignedTo;
            if ($admin && $admin->id !== auth()->id()) {
                $admin->notify(new \App\Notifications\RequestActioned($maintenance, 'Maintenance'));
            }
        }
    }

    private function notifySuperAdminForReview($maintenance, $type)
    {
        // Find all superadmins
        $superadmins = \App\Models\User::whereIn('role', ['superadmin', 'super_admin'])->get();

        foreach ($superadmins as $superadmin) {
            $superadmin->notify(new \App\Notifications\RequestSubmitted($maintenance, $type));
        }
    }

    public function fuel()
    {
        $user = auth()->user();
        $query = \App\Models\FuelLog::with(['vehicle', 'driver.user', 'assignedTo'])->latest();

        if ($user->role === 'admin') {
            $query->where('cost', '<=', 20000);
        } elseif ($user->role === 'superadmin') {
            $query->where('cost', '>', 20000);
        }

        $fuelLogs = $query->get();
        $vehicles = Vehicle::latest()->get();
        $drivers = \App\Models\Driver::with('user')->get();

        return Inertia::render('Dashboard/Fuel', [
            'fuelLogs' => $fuelLogs,
            'vehicles' => $vehicles,
            'drivers' => $drivers
        ]);
    }

    public function storeFuel(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'date' => 'required|date',
            'liters' => 'required|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'odometer_at_fill' => 'required|numeric|min:0',
        ]);

        $validated['status'] = 'Pending';
        $validated['assigned_to'] = $this->getAssigneeForCost($validated['cost']);
        $validated['created_by'] = auth()->id();

        $fuelLog = \App\Models\FuelLog::create($validated);

        if ($fuelLog->assignedTo) {
            $fuelLog->assignedTo->notify(new \App\Notifications\RequestSubmitted($fuelLog, 'Fuel'));
        }

        return back();
    }

    public function actionFuel(\Illuminate\Http\Request $request, \App\Models\FuelLog $fuelLog)
    {
        if (auth()->user()->role === 'manager') {
            abort(403, 'Managers cannot action requests.');
        }

        $userRole = auth()->user()->role;
        $isSuperAdmin = $userRole === 'superadmin' || $userRole === 'super_admin';
        $isAdmin = $userRole === 'admin';

        // Determine if this request needs superadmin approval
        $needsSuperAdmin = $fuelLog->cost > 20000;

        // For admin approving low-cost requests directly
        if ($isAdmin && !$needsSuperAdmin) {
            $validated = $request->validate([
                'status' => 'required|in:Accepted,Rejected',
                'reviewer_comment' => 'nullable|string',
            ]);

            $fuelLog->update([
                'status' => $validated['status'],
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            $this->notifyFuelDecision($fuelLog);

            return back();
        }

        // For superadmin approving/rejecting high-cost requests
        if ($isSuperAdmin && $needsSuperAdmin) {
            $validated = $request->validate([
                'status' => 'required|in:Accepted,Rejected',
                'reviewer_comment' => 'required|string',
            ]);

            $fuelLog->update([
                'status' => $validated['status'],
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            $this->notifyFuelDecision($fuelLog);

            return back();
        }

        // Admin forwarding high-cost request to superadmin with comment
        if ($isAdmin && $needsSuperAdmin) {
            $validated = $request->validate([
                'reviewer_comment' => 'required|string',
            ]);

            $fuelLog->update([
                'status' => 'Pending',
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            $this->notifySuperAdminForReview($fuelLog, 'Fuel');

            return back();
        }

        abort(403, 'Unauthorized action.');
    }

    private function notifyFuelDecision($fuelLog)
    {
        // Notify the creator
        if ($fuelLog->createdBy) {
            $fuelLog->createdBy->notify(new \App\Notifications\RequestActioned($fuelLog, 'Fuel'));
        }

        // Notify the driver
        if ($fuelLog->driver && $fuelLog->driver->user) {
            Mail::to($fuelLog->driver->user->email)->send(new FuelRequestDecision($fuelLog));
        }

        // Notify the admin who processed it (if superadmin is acting)
        if (auth()->user()->role === 'superadmin' || auth()->user()->role === 'super_admin') {
            $admin = $fuelLog->assignedTo;
            if ($admin && $admin->id !== auth()->id()) {
                $admin->notify(new \App\Notifications\RequestActioned($fuelLog, 'Fuel'));
            }
        }
    }

    private function parseCsv($file)
    {
        $data = [];
        if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
            $headers = fgetcsv($handle, 1000, ',');
            $headers = array_map(function ($header) {
                return trim(strtolower($header));
            }, $headers);

            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                if (count($headers) == count($row)) {
                    $data[] = array_combine($headers, $row);
                }
            }
            fclose($handle);
        }
        return $data;
    }

    public function importVehicles(\Illuminate\Http\Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $rows = $this->parseCsv($request->file('file'));

        foreach ($rows as $row) {
            if (!isset($row['vin']) || !isset($row['license_plate']))
                continue;

            Vehicle::updateOrCreate(
                ['vin' => $row['vin']],
                [
                    'make' => $row['make'] ?? 'Unknown',
                    'model' => $row['model'] ?? 'Unknown',
                    'year' => $row['year'] ?? date('Y'),
                    'license_plate' => $row['license_plate'],
                    'odometer' => $row['odometer'] ?? 0,
                    'vendor' => $row['vendor'] ?? null,
                    'status' => 'active'
                ]
            );
        }

        return back();
    }

    public function importDrivers(\Illuminate\Http\Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $rows = $this->parseCsv($request->file('file'));

        foreach ($rows as $row) {
            if (!isset($row['email']) || !isset($row['license_no']))
                continue;

            $user = \App\Models\User::firstOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'] ?? 'Unknown',
                    'password' => \Illuminate\Support\Facades\Hash::make($row['password'] ?? 'password'),
                    'role' => 'driver',
                ]
            );

            \App\Models\Driver::updateOrCreate(
                ['license_no' => $row['license_no']],
                [
                    'user_id' => $user->id,
                    'license_exp' => $row['license_exp'] ?? now()->addYears(1)->format('Y-m-d'),
                ]
            );
        }

        return back();
    }

    public function importMaintenance(\Illuminate\Http\Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $rows = $this->parseCsv($request->file('file'));

        foreach ($rows as $row) {
            // Find the plate number key (could be 'plate number', 'plate_number', 'license_plate', etc)
            $plateKey = null;
            foreach ($row as $key => $value) {
                $cleanKey = str_replace(' ', '_', strtolower($key));
                if (in_array($cleanKey, ['plate_number', 'license_plate'])) {
                    $plateKey = $key;
                    break;
                }
            }

            if (!$plateKey || empty($row[$plateKey]))
                continue;

            $vehicle = Vehicle::where('license_plate', trim($row[$plateKey]))->first();
            if (!$vehicle)
                continue;

            // Helper to find a field robustly
            $findField = function ($names) use ($row) {
                foreach ($row as $key => $value) {
                    $cleanKey = str_replace([' ', '(', ')'], ['_', '', ''], strtolower($key));
                    if (in_array($cleanKey, $names)) {
                        return $value;
                    }
                }
                return null;
            };

            $cost = $findField(['amount', 'amount_n', 'cost']) ?? 0;

            \App\Models\Maintenance::create([
                'vehicle_id' => $vehicle->id,
                'type' => $findField(['type']) ?? 'Regular Servicing',
                'service_type' => $findField(['service_type']) ?? 'General Service',
                'diagnosis' => $findField(['diagnosis']),
                'work_to_be_done' => $findField(['work_to_be_done']),
                'vehicle_location' => $findField(['vehicle_location', 'location']),
                'handled_by' => $findField(['handled_by']),
                'supervised_by' => $findField(['supervised_by']),
                'company' => $findField(['company']),
                'vehicle_user' => $findField(['vehicle_user']),
                'cost' => is_numeric($cost) ? $cost : (float) preg_replace('/[^0-9.]/', '', $cost),
                'date' => $findField(['date']) ?? now()->format('Y-m-d'),
                'status' => 'Pending',
                'assigned_to' => $this->getAssigneeForCost($cost),
            ]);
        }

        return back();
    }

    public function importFuel(\Illuminate\Http\Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $rows = $this->parseCsv($request->file('file'));

        foreach ($rows as $row) {
            if (!isset($row['license_plate']) || !isset($row['liters']) || !isset($row['cost']))
                continue;

            $vehicle = Vehicle::where('license_plate', $row['license_plate'])->first();
            if (!$vehicle)
                continue;

            $driverId = null;
            if (!empty($row['driver_email'])) {
                $user = \App\Models\User::where('email', $row['driver_email'])->first();
                if ($user) {
                    $driver = \App\Models\Driver::where('user_id', $user->id)->first();
                    if ($driver)
                        $driverId = $driver->id;
                }
            }

            $cost = $row['cost'];
            \App\Models\FuelLog::create([
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driverId,
                'liters' => $row['liters'],
                'cost' => $cost,
                'odometer_at_fill' => $row['odometer_at_fill'] ?? $vehicle->odometer,
                'date' => $row['date'] ?? now()->format('Y-m-d'),
                'status' => 'Pending',
                'assigned_to' => $this->getAssigneeForCost($cost),
            ]);
        }

        return back();
    }

    public function importCompliance(\Illuminate\Http\Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $rows = $this->parseCsv($request->file('file'));

        foreach ($rows as $row) {
            if (!isset($row['entity_type']) || !isset($row['entity_identifier']) || !isset($row['document_type']))
                continue;

            $type = strtolower($row['entity_type']);
            $morphClass = null;
            $morphId = null;

            if ($type === 'vehicle' || $type === 'v') {
                $vehicle = Vehicle::where('license_plate', $row['entity_identifier'])->first();
                if ($vehicle) {
                    $morphClass = \App\Models\Vehicle::class;
                    $morphId = $vehicle->id;
                }
            } elseif ($type === 'driver' || $type === 'd') {
                $user = \App\Models\User::where('email', $row['entity_identifier'])->first();
                if ($user) {
                    $driver = \App\Models\Driver::where('user_id', $user->id)->first();
                    if ($driver) {
                        $morphClass = \App\Models\Driver::class;
                        $morphId = $driver->id;
                    }
                }
            }

            if (!$morphClass || !$morphId)
                continue;

            \App\Models\Document::create([
                'documentable_type' => $morphClass,
                'documentable_id' => $morphId,
                'document_type' => $row['document_type'],
                'expiry_date' => !empty($row['expiry_date']) ? $row['expiry_date'] : null,
                'url' => null,
            ]);
        }

        return back();
    }

    public function compliance()
    {
        if (auth()->user()->role === 'driver') {
            abort(403, 'Unauthorized access.');
        }

        $documents = \App\Models\Document::with('documentable')->latest()->get();
        $vehicles = Vehicle::latest()->get();
        $drivers = \App\Models\Driver::with('user')->get();

        $documents = $documents->map(function ($doc) {
            $docName = 'Unknown';
            if ($doc->documentable_type === \App\Models\Vehicle::class && $doc->documentable) {
                $docName = $doc->documentable->make . ' ' . $doc->documentable->model . ' (' . $doc->documentable->license_plate . ')';
            } elseif ($doc->documentable_type === \App\Models\Driver::class && $doc->documentable && $doc->documentable->user) {
                $docName = $doc->documentable->user->name;
            }
            $doc->entity_name = $docName;
            return $doc;
        });

        return Inertia::render('Dashboard/Compliance', [
            'documents' => $documents,
            'vehicles' => $vehicles,
            'drivers' => $drivers
        ]);
    }

    public function storeCompliance(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'documentable_type' => 'required|in:vehicle,driver',
            'documentable_id' => 'required|integer',
            'document_type' => 'required|string|max:255',
            'expiry_date' => 'nullable|date',
            'url' => 'nullable|string',
        ]);

        $typeMap = [
            'vehicle' => \App\Models\Vehicle::class,
            'driver' => \App\Models\Driver::class,
        ];

        \App\Models\Document::create([
            'documentable_type' => $typeMap[$validated['documentable_type']],
            'documentable_id' => $validated['documentable_id'],
            'document_type' => $validated['document_type'],
            'expiry_date' => $validated['expiry_date'],
            'url' => $validated['url'],
        ]);

        return back();
    }

    public function users()
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'superadmin', 'admin'])) {
            abort(403, 'Unauthorized access.');
        }

        $users = \App\Models\User::all();
        return Inertia::render('Dashboard/Users', [
            'users' => $users
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'superadmin', 'admin'])) {
            abort(403, 'Unauthorized access.');
        }

        $request->validate([
            'role' => 'required|in:admin,superadmin,manager,driver',
        ]);

        $user->update([
            'role' => $request->role,
        ]);

        return back();
    }

    public function reports()
    {
        if (auth()->user()->role === 'driver') {
            abort(403, 'Unauthorized access.');
        }

        // Simple aggregate data for reports. 
        // We could filter by a date range, but we'll return overall summaries and let the frontend do lightweight filtering or we can accept 'start' and 'end' dates.
        $start = request('start') ? \Carbon\Carbon::parse(request('start')) : now()->startOfMonth();
        $end = request('end') ? \Carbon\Carbon::parse(request('end')) : now()->endOfMonth();

        $totalVehicles = Vehicle::count();
        $activeDrivers = \App\Models\Driver::count();

        $totalMaintenanceCost = \App\Models\Maintenance::whereBetween('date', [$start, $end])
            ->where('status', 'Accepted')
            ->sum('cost');

        $totalFuelCost = \App\Models\FuelLog::whereBetween('date', [$start, $end])
            ->where('status', 'Accepted')
            ->sum('cost');

        $maintenanceRecords = \App\Models\Maintenance::with('vehicle')
            ->whereBetween('date', [$start, $end])
            ->latest()->get();

        $fuelRecords = \App\Models\FuelLog::with('vehicle')
            ->whereBetween('date', [$start, $end])
            ->latest()->get();

        return Inertia::render('Dashboard/Reports', [
            'summary' => [
                'total_vehicles' => $totalVehicles,
                'active_drivers' => $activeDrivers,
                'total_maintenance_cost' => $totalMaintenanceCost,
                'total_fuel_cost' => $totalFuelCost,
                'period_start' => $start->format('Y-m-d'),
                'period_end' => $end->format('Y-m-d'),
            ],
            'maintenance_records' => $maintenanceRecords,
            'fuel_records' => $fuelRecords,
        ]);
    }
}
