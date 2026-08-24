<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Domains\Fleet\Models\Vehicle;
use App\Domains\Identity\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\MaintenanceRequestDecision;
use App\Mail\FuelRequestDecision;
use App\Mail\InvoiceForwarded;
use App\Notifications\ReviewRequestForwarded;

class DashboardController extends Controller
{
    public function index()
    {
        if (auth()->user()->role === 'driver') {
            return redirect()->route('dashboard.maintenance');
        }

        if (auth()->user()->role === 'accountant') {
            return redirect()->route('dashboard.approval-desk');
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
        $upcomingExpiries = \App\Domains\Fleet\Models\Document::with('documentable')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays(30)->format('Y-m-d'))
            ->get()->map(function ($doc) {
                $docName = 'Unknown';
                if ($doc->documentable_type === \App\Domains\Fleet\Models\Vehicle::class && $doc->documentable) {
                    $docName = $doc->documentable->make . ' ' . $doc->documentable->model . ' (' . $doc->documentable->license_plate . ')';
                } elseif ($doc->documentable_type === \App\Domains\Driver\Models\Driver::class && $doc->documentable && $doc->documentable->user) {
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

        $drivers = \App\Domains\Driver\Models\Driver::with('user')->get();

        return Inertia::render('Dashboard/Vehicles', [
            'vehicles' => $vehicles,
            'drivers' => $drivers
        ]);
    }

    public function storeVehicle(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'chassis_number' => 'required|string|unique:vehicles|max:255',
            'license_plate' => 'required|string|unique:vehicles|max:255',
            'vin' => 'nullable|string|max:255',
            'vendor' => 'nullable|string|max:255',
            'year' => 'nullable|integer|min:1900|max:2100',
            'base_location' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'assigned_user' => 'nullable|string|max:255',
            'vehicle_license' => 'nullable|string|max:255',
            'road_worthiness' => 'nullable|string|max:255',
            'insurance' => 'nullable|string|max:255',
            'stage_carriage' => 'nullable|string|max:255',
            'mot' => 'nullable|string|max:255',
            'hackney' => 'nullable|string|max:255',
            'lg_papers' => 'nullable|string|max:255',
            'battery' => 'nullable|string|max:255',
            'driver_id' => 'nullable|exists:drivers,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $validated['status'] = 'active';

        $vehicle = Vehicle::create([
            'name' => $validated['name'],
            'chassis_number' => $validated['chassis_number'],
            'license_plate' => $validated['license_plate'],
            'vin' => $validated['vin'] ?? null,
            'vendor' => $validated['vendor'] ?? null,
            'year' => $validated['year'] ?? null,
            'base_location' => $validated['base_location'] ?? null,
            'color' => $validated['color'] ?? null,
            'assigned_user' => $validated['assigned_user'] ?? null,
            'vehicle_license' => $validated['vehicle_license'] ?? null,
            'road_worthiness' => $validated['road_worthiness'] ?? null,
            'insurance' => $validated['insurance'] ?? null,
            'stage_carriage' => $validated['stage_carriage'] ?? null,
            'mot' => $validated['mot'] ?? null,
            'hackney' => $validated['hackney'] ?? null,
            'lg_papers' => $validated['lg_papers'] ?? null,
            'battery' => $validated['battery'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'status' => $validated['status'],
        ]);

        if (!empty($validated['driver_id'])) {
            \App\Domains\Driver\Models\Trip::create([
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

        $drivers = \App\Domains\Driver\Models\Driver::with(['user', 'documents'])->latest()->get();
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
        $user = \App\Domains\Identity\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => 'driver',
        ]);

        // Create the driver profile linked to the user
        \App\Domains\Driver\Models\Driver::create([
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

    public function destroyDriver(\App\Domains\Driver\Models\Driver $driver)
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

        // Compliance checks
        $vehicle = \App\Domains\Fleet\Models\Vehicle::find($validated['vehicle_id']);
        $driver = \App\Domains\Driver\Models\Driver::find($validated['driver_id']);

        $mandatoryVehicles = config('compliance.vehicle', []);
        $mandatoryDrivers = config('compliance.driver', []);

        foreach ($mandatoryVehicles as $docType) {
            $hasValid = $vehicle->documents()->where('document_type', $docType)->where('is_archived', false)->where('status', 'Verified')->where(function($q) {
                $q->whereNull('expiry_date')->orWhere('expiry_date', '>', now());
            })->exists();

            if (!$hasValid) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'vehicle_id' => "Vehicle is missing a valid/verified {$docType}."
                ]);
            }
        }

        foreach ($mandatoryDrivers as $docType) {
            $hasValid = $driver->documents()->where('document_type', $docType)->where('is_archived', false)->where('status', 'Verified')->where(function($q) {
                $q->whereNull('expiry_date')->orWhere('expiry_date', '>', now());
            })->exists();

            if (!$hasValid) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'driver_id' => "Driver is missing a valid/verified {$docType}."
                ]);
            }
        }

        \App\Domains\Driver\Models\Trip::create([
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

            $trip = \App\Domains\Driver\Models\Trip::findOrFail($tripId);
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

    public function destroyTrip(\App\Domains\Driver\Models\Trip $trip)
    {
        $trip->delete();
        return back();
    }

    public function trips()
    {
        if (auth()->user()->role === 'driver') {
            abort(403, 'Unauthorized access.');
        }

        $query = \App\Domains\Driver\Models\Trip::with(['vehicle', 'driver.user'])->latest();

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
        $drivers = \App\Domains\Driver\Models\Driver::with('user')->get();
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
        $query = \App\Domains\Maintenance\Models\Maintenance::with(['vehicle', 'assignedTo', 'vendors'])->latest();

        // Both admin and superadmin see ALL records (no cost-based filtering)

        $maintenances = $query->get();
        $vehicles = Vehicle::latest()->get();

        return Inertia::render('Dashboard/Maintenance', [
            'maintenances' => $maintenances,
            'vehicles' => $vehicles,
            'userRole' => $user->role,
        ]);
    }

    private function getAssigneeForCost($cost)
    {
        // Always assign to admin first — admin is the first-line reviewer for all requests
        $user = \App\Domains\Identity\Models\User::where('role', 'admin')->first();
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
            'vehicle_user' => 'nullable|string|max:255',
            'date' => 'required|date',
            'vendors' => 'required|array|min:1',
            'vendors.*.vendor_name' => 'required|string|max:255',
            'vendors.*.vendor_price' => 'required|numeric|min:0',
            'vendors.*.additional_comments' => 'nullable|string',
        ]);

        $totalCost = collect($validated['vendors'])->sum('vendor_price');

        $maintenanceData = $validated;
        unset($maintenanceData['vendors']);
        $maintenanceData['cost'] = $totalCost;
        $maintenanceData['status'] = 'Pending';
        $maintenanceData['assigned_to'] = $this->getAssigneeForCost($totalCost);
        $maintenanceData['created_by'] = auth()->id();
        $maintenanceData['company'] = null; // We can set this to null or just let it be if it's nullable

        $maintenance = \App\Domains\Maintenance\Models\Maintenance::create($maintenanceData);

        foreach ($validated['vendors'] as $vendorData) {
            $maintenance->vendors()->create([
                'vendor_name' => $vendorData['vendor_name'],
                'vendor_price' => $vendorData['vendor_price'],
                'additional_comments' => $vendorData['additional_comments'],
            ]);
        }

        if ($maintenance->assignedTo) {
            $maintenance->assignedTo->notify(new \App\Notifications\RequestSubmitted($maintenance, 'Maintenance'));
        }

        return back();
    }

    public function actionMaintenance(\Illuminate\Http\Request $request, \App\Domains\Maintenance\Models\Maintenance $maintenance)
    {
        if (auth()->user()->role === 'manager') {
            abort(403, 'Managers cannot action requests.');
        }

        $userRole = auth()->user()->role;
        $isSuperAdmin = $userRole === 'superadmin' || $userRole === 'super_admin';
        $isAdmin = $userRole === 'admin';

        // Determine if this request needs superadmin approval
        $needsSuperAdmin = $maintenance->cost > 20000;

        \Log::info('actionMaintenance called', [
            'maintenance_id' => $maintenance->id,
            'cost' => $maintenance->cost,
            'cost_type' => gettype($maintenance->cost),
            'current_status' => $maintenance->status,
            'user_role' => $userRole,
            'is_admin' => $isAdmin,
            'is_super_admin' => $isSuperAdmin,
            'needs_super_admin' => $needsSuperAdmin,
            'request_status' => $request->input('status'),
            'request_comment' => $request->input('reviewer_comment'),
        ]);

        // Admin approving/rejecting low-cost requests (≤₦20,000) directly
        if ($isAdmin && !$needsSuperAdmin && $maintenance->status === 'Pending') {
            $validated = $request->validate([
                'status' => 'required|in:Accepted,Rejected',
                'reviewer_comment' => 'nullable|string',
            ]);

            $maintenance->update([
                'status' => $validated['status'],
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            $this->notifyMaintenanceDecision($maintenance);

            return back();
        }

        // Admin forwarding high-cost request (>₦20,000) to superadmin or declining directly
        if ($isAdmin && $needsSuperAdmin && $maintenance->status === 'Pending') {
            \Log::info('Entering maintenance high-cost block (forward or decline)');

            $validated = $request->validate([
                'status' => 'nullable|in:Rejected', // 'status' will be empty if submitting for review
                'reviewer_comment' => 'required|string',
            ]);

            // If the admin is declining it, reject directly and do not forward
            if (isset($validated['status']) && $validated['status'] === 'Rejected') {
                $maintenance->update([
                    'status' => 'Rejected',
                    'reviewer_comment' => $validated['reviewer_comment'],
                    'assigned_to' => auth()->id(),
                ]);

                $this->notifyMaintenanceDecision($maintenance);
                return back()->with('success', 'Request has been declined.');
            }

            // Otherwise, forward to superadmin for review
            try {
                // Find the superadmin to assign to
                $superadmin = \App\Domains\Identity\Models\User::whereIn('role', ['superadmin', 'super_admin'])->first();

                if (!$superadmin) {
                    \Log::warning('No superadmin found to forward maintenance request', ['maintenance_id' => $maintenance->id]);
                    return back()->with('error', 'No Super Admin user found. Please contact support.');
                }

                \Log::info('Found superadmin', ['superadmin_id' => $superadmin->id, 'superadmin_role' => $superadmin->role]);

                $maintenance->update([
                    'status' => 'Under Review',
                    'reviewer_comment' => $validated['reviewer_comment'],
                    'assigned_to' => $superadmin->id,
                ]);

                \Log::info('Maintenance status updated to Under Review', ['maintenance_id' => $maintenance->id]);
            } catch (\Exception $e) {
                \Log::error('Failed to update maintenance status for review', [
                    'maintenance_id' => $maintenance->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return back()->with('error', 'Failed to forward request: ' . $e->getMessage());
            }

            // Notify superadmin that review is needed (non-critical)
            try {
                $this->notifySuperAdminForReview($maintenance, 'Maintenance');
                \Log::info('Superadmin notified for maintenance review', ['maintenance_id' => $maintenance->id]);
            } catch (\Exception $e) {
                \Log::error('Failed to notify superadmin for maintenance review', [
                    'maintenance_id' => $maintenance->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return back()->with('success', 'Request forwarded to Super Admin for review.');
        }

        // Superadmin approving/rejecting high-cost requests that are Under Review
        if ($isSuperAdmin && $needsSuperAdmin && $maintenance->status === 'Under Review') {
            $validated = $request->validate([
                'status' => 'required|in:Accepted,Rejected',
                'reviewer_comment' => 'required|string',
            ]);

            $maintenance->update([
                'status' => $validated['status'],
                'reviewer_comment' => $validated['reviewer_comment'],
                'assigned_to' => auth()->id(),
            ]);

            $this->notifyMaintenanceDecision($maintenance);

            return back()->with('success', 'Request has been ' . strtolower($validated['status']) . '.');
        }

        \Log::warning('actionMaintenance: No condition matched', [
            'maintenance_id' => $maintenance->id,
            'status' => $maintenance->status,
            'cost' => $maintenance->cost,
            'user_role' => $userRole,
            'is_admin' => $isAdmin,
            'is_super_admin' => $isSuperAdmin,
            'needs_super_admin' => $needsSuperAdmin,
        ]);

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

    private function notifySuperAdminForReview($request, $type)
    {
        $adminName = auth()->user()->name;

        // Find all superadmins and send the forwarded review notification
        $superadmins = \App\Domains\Identity\Models\User::whereIn('role', ['superadmin', 'super_admin'])->get();

        foreach ($superadmins as $superadmin) {
            $superadmin->notify(new ReviewRequestForwarded($request, $type, $adminName));
        }
    }

    public function fuel()
    {
        $user = auth()->user();
        $query = \App\Domains\Telematics\Models\FuelLog::with(['vehicle', 'driver.user', 'assignedTo'])->latest();

        // Both admin and superadmin see ALL records (no cost-based filtering)

        $fuelLogs = $query->get();
        $vehicles = Vehicle::latest()->get();
        $drivers = \App\Domains\Driver\Models\Driver::with('user')->get();

        return Inertia::render('Dashboard/Fuel', [
            'fuelLogs' => $fuelLogs,
            'vehicles' => $vehicles,
            'drivers' => $drivers,
            'userRole' => $user->role,
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

        $fuelLog = \App\Domains\Telematics\Models\FuelLog::create($validated);

        if ($fuelLog->assignedTo) {
            $fuelLog->assignedTo->notify(new \App\Notifications\RequestSubmitted($fuelLog, 'Fuel'));
        }

        return back();
    }

    public function actionFuel(\Illuminate\Http\Request $request, \App\Domains\Telematics\Models\FuelLog $fuelLog)
    {
        if (auth()->user()->role === 'manager') {
            abort(403, 'Managers cannot action requests.');
        }

        $userRole = auth()->user()->role;
        $isSuperAdmin = $userRole === 'superadmin' || $userRole === 'super_admin';
        $isAdmin = $userRole === 'admin';

        // Determine if this request needs superadmin approval
        $needsSuperAdmin = $fuelLog->cost > 20000;

        \Log::info('actionFuel called', [
            'fuel_log_id' => $fuelLog->id,
            'cost' => $fuelLog->cost,
            'cost_type' => gettype($fuelLog->cost),
            'current_status' => $fuelLog->status,
            'user_role' => $userRole,
            'is_admin' => $isAdmin,
            'is_super_admin' => $isSuperAdmin,
            'needs_super_admin' => $needsSuperAdmin,
            'request_status' => $request->input('status'),
            'request_comment' => $request->input('reviewer_comment'),
        ]);

        // Admin approving/rejecting low-cost requests (≤₦20,000) directly
        if ($isAdmin && !$needsSuperAdmin && $fuelLog->status === 'Pending') {
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

        // Admin forwarding high-cost request (>₦20,000) to superadmin
        if ($isAdmin && $needsSuperAdmin && $fuelLog->status === 'Pending') {
            \Log::info('Entering fuel forwarding block for superadmin review');

            $validated = $request->validate([
                'reviewer_comment' => 'required|string',
            ]);

            try {
                // Find the superadmin to assign to
                $superadmin = \App\Domains\Identity\Models\User::whereIn('role', ['superadmin', 'super_admin'])->first();

                if (!$superadmin) {
                    \Log::warning('No superadmin found to forward fuel request', ['fuel_log_id' => $fuelLog->id]);
                    return back()->with('error', 'No Super Admin user found. Please contact support.');
                }

                \Log::info('Found superadmin', ['superadmin_id' => $superadmin->id, 'superadmin_role' => $superadmin->role]);

                $fuelLog->update([
                    'status' => 'Under Review',
                    'reviewer_comment' => $validated['reviewer_comment'],
                    'assigned_to' => $superadmin->id,
                ]);

                \Log::info('Fuel status updated to Under Review', ['fuel_log_id' => $fuelLog->id]);
            } catch (\Exception $e) {
                \Log::error('Failed to update fuel log status for review', [
                    'fuel_log_id' => $fuelLog->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return back()->with('error', 'Failed to forward request: ' . $e->getMessage());
            }

            // Notify superadmin that review is needed (non-critical)
            try {
                $this->notifySuperAdminForReview($fuelLog, 'Fuel');
                \Log::info('Superadmin notified for fuel review', ['fuel_log_id' => $fuelLog->id]);
            } catch (\Exception $e) {
                \Log::error('Failed to notify superadmin for fuel review', [
                    'fuel_log_id' => $fuelLog->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return back()->with('success', 'Request forwarded to Super Admin for review.');
        }

        // Superadmin approving/rejecting high-cost requests that are Under Review
        if ($isSuperAdmin && $needsSuperAdmin && $fuelLog->status === 'Under Review') {
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

            return back()->with('success', 'Request has been ' . strtolower($validated['status']) . '.');
        }

        \Log::warning('actionFuel: No condition matched', [
            'fuel_log_id' => $fuelLog->id,
            'status' => $fuelLog->status,
            'cost' => $fuelLog->cost,
            'user_role' => $userRole,
            'is_admin' => $isAdmin,
            'is_super_admin' => $isSuperAdmin,
            'needs_super_admin' => $needsSuperAdmin,
        ]);

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
            if (!isset($row['chasis']) || !isset($row['plate_number'])) {
                continue;
            }

            Vehicle::updateOrCreate(
                ['chassis_number' => $row['chasis']],
                [
                    'vehicle_id' => !empty($row['id']) ? $row['id'] : null,
                    'name' => $row['vehicle_name'] ?? 'Unknown',
                    'license_plate' => $row['plate_number'],
                    'vin' => $row['vin'] ?? null,
                    'vendor' => $row['vendor'] ?? null,
                    'year' => $row['year'] ?? null,
                    'base_location' => $row['location'] ?? null,
                    'color' => $row['colour'] ?? null,
                    'assigned_user' => $row['user'] ?? null,
                    'vehicle_license' => $row['vehicle_license'] ?? null,
                    'road_worthiness' => $row['road_worthiness'] ?? null,
                    'insurance' => $row['insurance'] ?? null,
                    'stage_carriage' => $row['stage_cariage'] ?? null,
                    'mot' => $row['mot'] ?? null,
                    'hackney' => $row['hackney'] ?? null,
                    'lg_papers' => $row['lg_papers'] ?? null,
                    'battery' => $row['battery'] ?? null,
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

            $user = \App\Domains\Identity\Models\User::firstOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'] ?? 'Unknown',
                    'password' => \Illuminate\Support\Facades\Hash::make($row['password'] ?? 'password'),
                    'role' => 'driver',
                ]
            );

            \App\Domains\Driver\Models\Driver::updateOrCreate(
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

            $parsedCost = is_numeric($cost) ? $cost : (float) preg_replace('/[^0-9.]/', '', $cost);

            $maintenance = \App\Domains\Maintenance\Models\Maintenance::create([
                'vehicle_id' => $vehicle->id,
                'type' => $findField(['type']) ?? 'Regular Servicing',
                'service_type' => $findField(['service_type']) ?? 'General Service',
                'diagnosis' => $findField(['diagnosis']),
                'work_to_be_done' => $findField(['work_to_be_done']),
                'vehicle_location' => $findField(['vehicle_location', 'location']),
                'handled_by' => $findField(['handled_by']),
                'supervised_by' => $findField(['supervised_by']),
                'vehicle_user' => $findField(['vehicle_user']),
                'cost' => $parsedCost,
                'date' => $findField(['date']) ?? now()->format('Y-m-d'),
                'status' => 'Pending',
                'assigned_to' => $this->getAssigneeForCost($parsedCost),
            ]);

            $companyName = $findField(['company']);
            if ($companyName) {
                $maintenance->vendors()->create([
                    'vendor_name' => $companyName,
                    'vendor_price' => $parsedCost,
                    'additional_comments' => null,
                ]);
            }
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
                $user = \App\Domains\Identity\Models\User::where('email', $row['driver_email'])->first();
                if ($user) {
                    $driver = \App\Domains\Driver\Models\Driver::where('user_id', $user->id)->first();
                    if ($driver)
                        $driverId = $driver->id;
                }
            }

            $cost = $row['cost'];
            \App\Domains\Telematics\Models\FuelLog::create([
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
                    $morphClass = \App\Domains\Fleet\Models\Vehicle::class;
                    $morphId = $vehicle->id;
                }
            } elseif ($type === 'driver' || $type === 'd') {
                $user = \App\Domains\Identity\Models\User::where('email', $row['entity_identifier'])->first();
                if ($user) {
                    $driver = \App\Domains\Driver\Models\Driver::where('user_id', $user->id)->first();
                    if ($driver) {
                        $morphClass = \App\Domains\Driver\Models\Driver::class;
                        $morphId = $driver->id;
                    }
                }
            }

            if (!$morphClass || !$morphId)
                continue;

            \App\Domains\Fleet\Models\Document::create([
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

        $documents = \App\Domains\Fleet\Models\Document::with('documentable')->where('is_archived', false)->latest()->get();
        $vehicles = Vehicle::latest()->get();
        $drivers = \App\Domains\Driver\Models\Driver::with('user')->get();

        $documents = $documents->map(function ($doc) {
            $docName = 'Unknown';
            if ($doc->documentable_type === \App\Domains\Fleet\Models\Vehicle::class && $doc->documentable) {
                $docName = $doc->documentable->make . ' ' . $doc->documentable->model . ' (' . $doc->documentable->license_plate . ')';
            } elseif ($doc->documentable_type === \App\Domains\Driver\Models\Driver::class && $doc->documentable && $doc->documentable->user) {
                $docName = $doc->documentable->user->name;
            }
            $doc->entity_name = $docName;
            return $doc;
        });

        $mandatoryVehicles = config('compliance.vehicle', []);
        $mandatoryDrivers = config('compliance.driver', []);
        $missingDocuments = [];

        foreach ($vehicles as $vehicle) {
            $vehicleDocs = $documents->where('documentable_type', \App\Domains\Fleet\Models\Vehicle::class)->where('documentable_id', $vehicle->id);
            $missing = [];
            foreach ($mandatoryVehicles as $docType) {
                $hasValid = $vehicleDocs->where('document_type', $docType)->where('status', 'Verified')->filter(function($d) {
                    return !$d->expiry_date || \Carbon\Carbon::parse($d->expiry_date)->isFuture();
                })->isNotEmpty();
                if (!$hasValid) {
                    $missing[] = $docType;
                }
            }
            if (!empty($missing)) {
                $missingDocuments[] = [
                    'entity_type' => 'Vehicle',
                    'entity_name' => $vehicle->make . ' ' . $vehicle->model . ' (' . $vehicle->license_plate . ')',
                    'missing' => $missing,
                ];
            }
        }

        foreach ($drivers as $driver) {
            $driverDocs = $documents->where('documentable_type', \App\Domains\Driver\Models\Driver::class)->where('documentable_id', $driver->id);
            $missing = [];
            foreach ($mandatoryDrivers as $docType) {
                $hasValid = $driverDocs->where('document_type', $docType)->where('status', 'Verified')->filter(function($d) {
                    return !$d->expiry_date || \Carbon\Carbon::parse($d->expiry_date)->isFuture();
                })->isNotEmpty();
                if (!$hasValid) {
                    $missing[] = $docType;
                }
            }
            if (!empty($missing)) {
                $missingDocuments[] = [
                    'entity_type' => 'Driver',
                    'entity_name' => $driver->user ? $driver->user->name : 'Unknown Driver',
                    'missing' => $missing,
                ];
            }
        }

        return Inertia::render('Dashboard/Compliance', [
            'documents' => $documents,
            'vehicles' => $vehicles,
            'drivers' => $drivers,
            'missingDocuments' => $missingDocuments,
        ]);
    }

    public function storeCompliance(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'documentable_type' => 'required|in:vehicle,driver',
            'documentable_id' => 'required|integer',
            'document_type' => 'required|string|max:255',
            'reference_number' => 'nullable|string|max:255',
            'issuing_authority' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
            'url' => 'nullable|string',
            'document_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $typeMap = [
            'vehicle' => \App\Domains\Fleet\Models\Vehicle::class,
            'driver' => \App\Domains\Driver\Models\Driver::class,
        ];

        $morphClass = $typeMap[$validated['documentable_type']];

        // Archive previous documents of the same type for this entity
        \App\Domains\Fleet\Models\Document::where('documentable_type', $morphClass)
            ->where('documentable_id', $validated['documentable_id'])
            ->where('document_type', $validated['document_type'])
            ->update(['is_archived' => true]);

        $url = $validated['url'] ?? null;
        if ($request->hasFile('document_file')) {
            $path = $request->file('document_file')->store('documents', 'public');
            $url = '/storage/' . $path;
        }

        $userRole = auth()->user()->role;
        $isAdmin = in_array($userRole, ['admin', 'superadmin', 'super_admin']);

        \App\Domains\Fleet\Models\Document::create([
            'documentable_type' => $morphClass,
            'documentable_id' => $validated['documentable_id'],
            'document_type' => $validated['document_type'],
            'reference_number' => $validated['reference_number'] ?? null,
            'issuing_authority' => $validated['issuing_authority'] ?? null,
            'expiry_date' => $validated['expiry_date'] ?? null,
            'url' => $url,
            'status' => $isAdmin ? 'Verified' : 'Pending Verification',
        ]);

        return back();
    }

    public function actionCompliance(\Illuminate\Http\Request $request, \App\Domains\Fleet\Models\Document $document)
    {
        $userRole = auth()->user()->role;
        if (!in_array($userRole, ['admin', 'superadmin', 'super_admin'])) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'action' => 'required|in:verify,reject',
        ]);

        if ($validated['action'] === 'verify') {
            $document->update(['status' => 'Verified']);
        } else {
            $document->update(['status' => 'Rejected']);
        }

        return back()->with('success', 'Document status updated.');
    }

    public function users()
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'superadmin', 'admin'])) {
            abort(403, 'Unauthorized access.');
        }

        $users = \App\Domains\Identity\Models\User::all();
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
            'role' => 'required|in:admin,superadmin,manager,driver,accountant',
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
        $activeDrivers = \App\Domains\Driver\Models\Driver::count();

        $totalMaintenanceCost = \App\Domains\Maintenance\Models\Maintenance::whereBetween('date', [$start, $end])
            ->where('status', 'Accepted')
            ->sum('cost');

        $totalFuelCost = \App\Domains\Telematics\Models\FuelLog::whereBetween('date', [$start, $end])
            ->where('status', 'Accepted')
            ->sum('cost');

        $maintenanceRecords = \App\Domains\Maintenance\Models\Maintenance::with('vehicle')
            ->whereBetween('date', [$start, $end])
            ->latest()->get();

        $fuelRecords = \App\Domains\Telematics\Models\FuelLog::with('vehicle')
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

    public function financialReports()
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'superadmin', 'admin', 'accountant'])) {
            abort(403, 'Unauthorized access.');
        }

        $viewMode = request('view_mode', 'monthly');
        $year = (int) request('year', now()->year);
        $month = (int) request('month', now()->month);
        $vehicleId = request('vehicle_id');

        $maintenanceQuery = \App\Domains\Maintenance\Models\Maintenance::with('vehicle')
            ->where('status', 'Accepted')
            ->whereYear('date', $year);

        $fuelQuery = \App\Domains\Telematics\Models\FuelLog::with('vehicle')
            ->where('status', 'Accepted')
            ->whereYear('date', $year);

        if ($viewMode === 'monthly') {
            $maintenanceQuery->whereMonth('date', $month);
            $fuelQuery->whereMonth('date', $month);
        }

        if ($vehicleId) {
            $maintenanceQuery->where('vehicle_id', $vehicleId);
            $fuelQuery->where('vehicle_id', $vehicleId);
        }

        $vehicles = \App\Domains\Fleet\Models\Vehicle::select('id', 'make', 'model', 'license_plate')->get();

        return Inertia::render('Dashboard/FinancialReports', [
            'maintenance_records' => $maintenanceQuery->latest('date')->get(),
            'fuel_records' => $fuelQuery->latest('date')->get(),
            'year' => $year,
            'month' => $month,
            'view_mode' => $viewMode,
            'vehicle_id' => $vehicleId,
            'vehicles' => $vehicles,
        ]);
    }

    public function approvalDesk()
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'superadmin', 'admin', 'accountant'])) {
            abort(403, 'Unauthorized access.');
        }

        $maintenances = \App\Domains\Maintenance\Models\Maintenance::with(['vehicle', 'assignedTo', 'createdBy', 'vendors'])
            ->latest()
            ->get();

        $fuelLogs = \App\Domains\Telematics\Models\FuelLog::with(['vehicle', 'driver.user', 'assignedTo'])
            ->latest()
            ->get();

        // Summary counts
        $summary = [
            'total_maintenance' => $maintenances->count(),
            'total_fuel' => $fuelLogs->count(),
            'pending' => $maintenances->where('status', 'Pending')->count() + $fuelLogs->where('status', 'Pending')->count(),
            'accepted' => $maintenances->where('status', 'Accepted')->count() + $fuelLogs->where('status', 'Accepted')->count(),
            'rejected' => $maintenances->where('status', 'Rejected')->count() + $fuelLogs->where('status', 'Rejected')->count(),
            'under_review' => $maintenances->where('status', 'Under Review')->count() + $fuelLogs->where('status', 'Under Review')->count(),
            'total_maintenance_cost' => $maintenances->where('status', 'Accepted')->sum('cost'),
            'total_fuel_cost' => $fuelLogs->where('status', 'Accepted')->sum('cost'),
        ];

        return Inertia::render('Dashboard/ApprovalDesk', [
            'maintenances' => $maintenances,
            'fuelLogs' => $fuelLogs,
            'summary' => $summary,
            'userRole' => auth()->user()->role,
        ]);
    }

    public function sendInvoiceEmail(\Illuminate\Http\Request $request, string $type, int $id)
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'superadmin', 'admin', 'accountant'])) {
            abort(403, 'Unauthorized access.');
        }

        if ($type === 'maintenance') {
            $record = \App\Domains\Maintenance\Models\Maintenance::with(['vehicle', 'vendors'])->findOrFail($id);
            $recordType = 'Maintenance';
        } elseif ($type === 'fuel') {
            $record = \App\Domains\Telematics\Models\FuelLog::with(['vehicle', 'driver.user'])->findOrFail($id);
            $recordType = 'Fuel';
        } else {
            abort(400, 'Invalid request type.');
        }

        $senderName = auth()->user()->name;

        // Gather all recipients: managers, admins, superadmins
        $recipients = User::whereIn('role', ['manager', 'admin', 'superadmin', 'super_admin'])->get();

        if ($recipients->isEmpty()) {
            return back()->with('error', 'No managers or administrators found to send to.');
        }

        // Send to the first recipient, CC the rest
        $primaryRecipient = $recipients->first();
        $ccRecipients = $recipients->skip(1)->pluck('email')->toArray();

        // Also CC the accountant who is sending
        $ccRecipients[] = auth()->user()->email;

        $mail = Mail::to($primaryRecipient->email);
        if (!empty($ccRecipients)) {
            $mail->cc($ccRecipients);
        }

        $mail->send(new InvoiceForwarded($record, $recordType, $senderName));

        return back()->with('success', "Invoice for {$recordType} Request #{$id} has been sent successfully.");
    }
}
