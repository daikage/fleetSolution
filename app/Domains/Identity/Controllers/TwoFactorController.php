<?php

namespace App\Domains\Identity\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Identity\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    public function __construct(private Google2FA $google2fa)
    {
    }

    /**
     * Generate a new 2FA secret and return the QR code.
     */
    public function enable(Request $request)
    {
        $user = $request->user();

        if ($user->hasEnabledTwoFactorAuthentication()) {
            return back()->with('error', 'Two-factor authentication is already enabled.');
        }

        $secret = $this->google2fa->generateSecretKey();
        
        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_confirmed_at' => null, // Needs confirmation
        ])->save();

        return back()->with('status', 'two-factor-authentication-enabled');
    }

    /**
     * Confirm the 2FA setup by verifying a code.
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            return back()->with('error', 'Two-factor authentication has not been enabled.');
        }

        $valid = $this->google2fa->verifyKey(
            decrypt($user->two_factor_secret),
            $request->code
        );

        if (! $valid) {
            return back()->withErrors(['code' => 'The provided two-factor authentication code was invalid.']);
        }

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
        ])->save();

        return back()->with('status', 'two-factor-authentication-confirmed');
    }

    /**
     * Disable 2FA for the user.
     */
    public function disable(Request $request)
    {
        $user = $request->user();

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ])->save();

        return back()->with('status', 'two-factor-authentication-disabled');
    }

    /**
     * Show the 2FA challenge view during login.
     */
    public function challenge(Request $request)
    {
        if (! $request->session()->has('login.id')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    /**
     * Verify the 2FA code during login.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $userId = $request->session()->get('login.id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->forget('login.id');
            return redirect()->route('login');
        }

        $valid = $this->google2fa->verifyKey(
            decrypt($user->two_factor_secret),
            $request->code
        );

        if (! $valid) {
            return back()->withErrors(['code' => 'The provided two-factor authentication code was invalid.']);
        }

        // Successfully verified, log the user in!
        Auth::login($user, $request->session()->get('login.remember', false));
        
        $request->session()->regenerate();
        $request->session()->forget('login.id');
        $request->session()->forget('login.remember');

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
