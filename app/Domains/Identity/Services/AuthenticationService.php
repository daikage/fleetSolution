<?php

namespace App\Domains\Identity\Services;

use App\Domains\Identity\Models\User;
use App\Domains\Driver\Models\Driver;
use App\Domains\Driver\Models\Trip;
use Illuminate\Support\Facades\Hash;
use Exception;

class AuthenticationService
{
    /**
     * Authenticate a driver from the mobile app.
     *
     * @param string $email
     * @param string $password
     * @return array
     * @throws Exception
     */
    public function authenticateDriver(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw new Exception('Invalid credentials', 401);
        }

        if ($user->role !== 'driver') {
            throw new Exception('Unauthorized: Only drivers can login here.', 403);
        }

        $driver = Driver::where('user_id', $user->id)->first();
        if (!$driver) {
            throw new Exception('Driver profile not found for this user.', 404);
        }

        $trip = Trip::where('driver_id', $driver->id)->whereNull('end_time')->latest()->first();
        $vehicleId = $trip ? $trip->vehicle_id : null;

        $token = $user->createToken('mobile-app-driver', ['driver'])->plainTextToken;

        return [
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email']),
            'driver' => $driver->only(['id', 'license_no', 'phone']),
            'vehicle_id' => $vehicleId,
        ];
    }
}
