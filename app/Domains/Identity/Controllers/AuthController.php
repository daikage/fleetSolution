<?php

namespace App\Domains\Identity\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Identity\Models\User;
use App\Domains\Driver\Models\Driver;
use App\Domains\Driver\Models\Trip;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private \App\Domains\Identity\Services\AuthenticationService $authService)
    {
    }

    public function mobileLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $data = $this->authService->authenticateDriver($request->email, $request->password);
            return response()->json($data);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 400;
            return response()->json(['message' => $e->getMessage()], $status);
        }
    }
}
