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
        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|exists:vehicles,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Dispatch job to process the location in the background
        ProcessVehicleLocation::dispatch(
            $request->vehicle_id,
            $request->latitude,
            $request->longitude,
            $request->speed ?? 0
        );

        return response()->json(['status' => 'queued']);
    }
}
