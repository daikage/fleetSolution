<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Jobs\ProcessVehicleLocation;
use Illuminate\Support\Facades\Validator;

class TelematicsController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $trackerType = \App\Models\Setting::where('key', 'tracker_type')->value('value') ?? 'mobile_app';
        
        $user = $request->user();
        if ($user && $user->role === 'driver' && $trackerType !== 'mobile_app') {
            return response()->json(['status' => 'ignored', 'message' => 'Mobile app tracking is disabled in settings.']);
        }

        if (!in_array($trackerType, ['mobile_app', 'traccar', 'custom_iot'])) {
            return response()->json(['error' => 'Current tracker setting does not support this endpoint.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|exists:vehicles,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        ProcessVehicleLocation::dispatch(
            $request->vehicle_id,
            $request->latitude,
            $request->longitude,
            (int) ($request->speed ?? 0)
        );

        return response()->json(['status' => 'queued']);
    }

    public function storeOsmAnd(Request $request)
    {
        $trackerType = \App\Models\Setting::where('key', 'tracker_type')->value('value');
        if ($trackerType !== 'osmand') {
            return response()->json(['error' => 'OsmAnd tracking is not enabled.'], 403);
        }

        // OsmAnd typically sends: ?id=12345&lat=40.0&lon=-73.0&speed=50.0
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:vehicles,id',
            'lat' => 'required|numeric',
            'lon' => 'required|numeric',
            'speed' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        ProcessVehicleLocation::dispatch(
            $request->id,
            $request->lat,
            $request->lon,
            (int) ($request->speed ?? 0)
        );

        return response()->json(['status' => 'queued']);
    }

    /**
     * Return latest location for all vehicles (polling fallback for dashboard).
     */
    public function latestLocations()
    {
        $vehicles = \App\Models\Vehicle::with('latestLocation')->get()
            ->map(fn($v) => [
                'id' => $v->id,
                'latitude' => $v->latestLocation?->latitude,
                'longitude' => $v->latestLocation?->longitude,
                'speed' => $v->latestLocation?->speed ?? 0,
                'updated_at' => $v->latestLocation?->created_at,
            ]);

        return response()->json($vehicles);
    }
}
