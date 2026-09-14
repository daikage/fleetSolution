<?php

namespace App\Domains\Identity\Services;

use App\Domains\Driver\Models\Driver;
use App\Domains\Driver\Models\Trip;
use App\Domains\Identity\Models\User;
use App\Exceptions\InvalidCredentialsException;
use App\Exceptions\DriverProfileNotFoundException;
use App\Exceptions\UnauthorizedUserException;
use Illuminate\Support\Facades\Hash;

class AuthenticationService
{
    /**
     * Authenticate a driver from the mobile app.
     *
     * @throws InvalidCredentialsException
     * @throws UnauthorizedUserException
     * @throws DriverProfileNotFoundException
     */
    public function authenticateDriver(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new InvalidCredentialsException('Invalid credentials.');
        }

        if ($user->role !== 'driver') {
            throw new UnauthorizedUserException('Unauthorized: Only drivers can login here.');
        }

        $driver = Driver::where('user_id', $user->id)->first();
        if (! $driver) {
            throw new DriverProfileNotFoundException('Driver profile not found for this user.');
        }

        $trip = Trip::where('driver_id', $driver->id)->whereNull('end_time')->latest()->first();
        $vehicleId = $trip ? $trip->vehicle_id : null;

        // Revoke all previous mobile-app-driver tokens for this user
        $user->tokens()->where('name', 'mobile-app-driver')->delete();

        $token = $user->createToken('mobile-app-driver', ['driver'])->plainTextToken;

        return [
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email']),
            'driver' => $driver->only(['id', 'license_no', 'phone']),
            'vehicle_id' => $vehicleId,
        ];
    }

    /**
     * Revoke all API tokens for a given driver user.
     * Used by admins to force-logout a driver from all devices.
     */
    public function revokeDriverTokens(int $userId): int
    {
        $user = User::findOrFail($userId);

        return $user->tokens()->where('name', 'mobile-app-driver')->delete();
    }
}
