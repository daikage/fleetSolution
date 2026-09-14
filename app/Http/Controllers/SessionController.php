<?php

namespace App\Http\Controllers;

use App\Domains\Identity\Models\User;
use App\Domains\Identity\Services\AuthenticationService;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(private AuthenticationService $authService) {}

    /**
     * Revoke all API tokens for a driver, forcing re-login on all devices.
     * Admin/superadmin use only.
     */
    public function revokeDevices(Request $request, User $user)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $revoked = $this->authService->revokeDriverTokens($user->id);

        return back()->with('success', "Signed out {$user->name} from all devices. ({$revoked} token(s) revoked)");
    }
}
