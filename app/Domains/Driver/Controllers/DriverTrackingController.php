<?php

namespace App\Domains\Driver\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DriverTrackingController extends Controller
{
    public function __construct(private \App\Domains\Driver\Services\DriverTrackingService $trackingService)
    {
    }

    public function shouldTrack(Request $request)
    {
        return response()->json($this->trackingService->checkTrackingRequirement($request->user()->id));
    }

    public function reportStatus(Request $request)
    {
        $request->validate([
            'is_tracking' => 'required|boolean',
            'location_enabled' => 'boolean',
            'battery_optimization_disabled' => 'boolean',
        ]);

        try {
            $response = $this->trackingService->reportStatus($request->user()->id, $request->is_tracking);
            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function autoPing(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        try {
            $response = $this->trackingService->processAutoPing(
                $request->user()->id,
                $request->latitude,
                $request->longitude,
                $request->speed
            );
            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function activeTrip(Request $request)
    {
        return response()->json($this->trackingService->getActiveTrip($request->user()->id));
    }
}