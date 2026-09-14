<?php

namespace App\Domains\Identity\Controllers;

use App\Domains\Identity\Services\AuthenticationService;
use App\Exceptions\InvalidCredentialsException;
use App\Exceptions\UnauthorizedUserException;
use App\Exceptions\DriverProfileNotFoundException;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function __construct(private AuthenticationService $authService) {}

    public function mobileLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $data = $this->authService->authenticateDriver($request->email, $request->password);

            return response()->json($data);
        } catch (InvalidCredentialsException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        } catch (UnauthorizedUserException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        } catch (DriverProfileNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        } catch (\Exception $e) {
            Log::error('Mobile login failed', ['error' => $e->getMessage()]);
            $status = is_int($e->getCode()) && $e->getCode() >= 100 && $e->getCode() < 600
                ? $e->getCode()
                : 500;

            return response()->json(['message' => 'An unexpected error occurred.'], $status);
        }
    }
}
