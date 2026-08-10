<?php

namespace App\Domains\Telematics\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Jobs\ProcessVehicleLocation;
use Illuminate\Support\Facades\Validator;

class TelematicsController extends Controller
{
    public function __construct(private \App\Domains\Telematics\Services\TelematicsService $telematicsService)
    {
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|exists:vehicles,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        try {
            $userRole = $request->user() ? $request->user()->role : null;
            $this->telematicsService->processMobileLocation(
                $request->vehicle_id,
                $request->latitude,
                $request->longitude,
                $request->speed,
                $userRole
            );
            return response()->json(['status' => 'processed']);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 400;
            if ($status === 400) {
                return response()->json(['status' => 'ignored', 'message' => $e->getMessage()]);
            }
            return response()->json(['error' => $e->getMessage()], $status);
        }
    }

    public function storeOsmAnd(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:vehicles,id',
            'lat' => 'required|numeric|between:-90,90',
            'lon' => 'required|numeric|between:-180,180',
            'speed' => 'nullable|numeric|between:0,500',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $providedSecret = $request->query('secret', '');

        try {
            $this->telematicsService->processOsmAndLocation(
                $request->id,
                $request->lat,
                $request->lon,
                $request->speed,
                $providedSecret
            );
            return response()->json(['status' => 'processed']);
        } catch (\Exception $e) {
            if ($e->getMessage() === 'Invalid or missing shared secret.') {
                \Illuminate\Support\Facades\Log::warning('Unauthorized OsmAnd access attempt from IP: ' . $request->ip());
            }
            $status = $e->getCode() ?: 403;
            return response()->json(['error' => $e->getMessage()], $status);
        }
    }

    public function latestLocations()
    {
        return response()->json($this->telematicsService->getLatestLocations());
    }
}
