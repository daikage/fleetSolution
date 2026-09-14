# FKG Fleet OS code review

*fkg-fleet-mgt-os · Laravel 13 · Inertia + React · Reverb · Reviewed 10 Sep 2026*

I read the routes, the controllers, the telematics pipeline, the approval workflow, broadcasting, auth and 2FA, and the Docker/Dokploy setup. The domain logic is solid: the compliance gate on trip creation and the ₦20,000 two-step approval both work as described. The problem is the layer around it. **Almost every write route only checks that someone is logged in, and anyone can sign up as an admin.** Fix that before real drivers and vendors start using the app.

| Severity | Count | Meaning |
|---|---:|---|
| Critical | 6 | Security holes |
| High | 8 | Broken or leaking |
| Medium | 8 | Correctness |
| Structure & deploy | 12 | Nothing broken yet; slows the next feature or deploy |

## What to fix this week

1. Close public sign-up (C1). It currently creates admins.
2. Rotate the APP_KEY (C3) that's committed in `DOKPLOY_SETUP.md`.
3. Delete the `/fix-map` route (C4).
4. Put role middleware on every write route (C5) and lock down role changes (C2).
5. ~~Add the scheduler to supervisord (H3) so document-expiry emails actually go out.~~ Done in the working copy; needs a redeploy.

*Items 1–4 take about half a day together. They matter more than anything else in this review.*

---

## Critical (6 findings)

Any of these lets someone who shouldn't have access change fleet data, approve spending, or read session data.

### C1 · Anyone can register, and every new account is an admin

**Critical** · Where: `RegisteredUserController.php:44`, `routes/auth.php:15–18`, `Welcome.jsx:44`

`/register` is public and hard-codes `'role' => 'admin'`. A stranger can sign up and immediately approve fuel and maintenance requests up to ₦20,000, delete vehicles, and see every driver.

**Change:** Remove the register routes and the Welcome link. Staff accounts should be created by an admin from the Users page, with a password-reset invite. If self-signup ever returns, the default role should be the lowest one and need approval.

### C2 · Admins can promote anyone, themselves included, to superadmin

**Critical** · Where: `DashboardController@updateUser :1663`

`updateUser` lets any admin assign any role, `superadmin` included, to any user. That defeats the "over ₦20,000 needs a Super Admin" rule. Combined with C1, anyone on the internet can become a superadmin.

**Change:** Only a superadmin can grant `admin` or `superadmin`. Nobody can change their own role. Log every role change.

```php
if ($user->is(auth()->user())) abort(403, 'You cannot change your own role.');
if (in_array($request->role, ['admin','superadmin']) && ! auth()->user()->isSuperAdmin()) abort(403);
```

### C3 · The real APP_KEY is committed to the repo

**Critical** · Where: `DOKPLOY_SETUP.md:51`

The key in the setup guide is identical to your local `.env`. `APP_KEY` signs sessions and cookies and encrypts the 2FA secrets (`encrypt($secret)` in TwoFactorController). If production uses it, anyone with repo access can forge sessions and decrypt 2FA seeds.

**Change:** Generate a new key with `php artisan key:generate --show` and set it only in Dokploy's environment. Replace the value in the doc with a placeholder. Rotating logs everyone out and makes existing 2FA enrolments unreadable, so users will need to set up 2FA again. If the repo has been shared, scrub the key from git history too.

### C4 · `GET /fix-map` rewrites every vehicle's location, and needs no login

**Critical** · Where: `routes/web.php:31`

It's a debug route with no middleware. Any visitor or crawler that hits it snaps every vehicle to the Lagos, Abuja or Ibadan office coordinates and writes a fake GPS ping for each one.

**Change:** Delete it. If you still need the reset, make it an artisan command (`php artisan fleet:reset-locations`).

### C5 · Most create, update and delete routes only check that someone is logged in

**Critical** · Where: `routes/web.php`, `destroyVehicle :370`, `destroyDriver :448`, `storeDriver`, `storeTrip / endTrip / destroyTrip`, `import*`

The page views block drivers, but the actions behind them don't. A driver session can post to `DELETE /dashboard/vehicles/{id}`, delete other drivers along with their user accounts, create new users through `storeDriver`, bulk-import CSVs, and start or end trips. The React UI hides the buttons. The server doesn't enforce it.

**Change:** Group the routes by who is allowed to use them and apply your existing `role` middleware to each group, or write Laravel Policies. Either way, authorisation lives in one place instead of 30 inline `in_array` checks.

```php
Route::middleware(['auth','verified','role:superadmin,admin,manager'])->group(function () {
    Route::post('/dashboard/vehicles', …); Route::delete('/dashboard/vehicles/{vehicle}', …);
    Route::post('/dashboard/drivers', …);  Route::post('/dashboard/*/import', …);
});
```

### C6 · A driver token can post GPS positions for any vehicle

**Critical** · Where: `TelematicsController@store :18`, `api.php:22`

`/api/telematics/location` accepts whatever `vehicle_id` it's sent. Any driver's mobile token can move any truck on the live map and spoil its location history. `/api/driver/auto-ping` already does this properly: it takes the vehicle from the driver's active trip.

**Change:** For drivers, reject any request where `vehicle_id` isn't the vehicle on their active trip, or send the mobile app through `auto-ping` only.

---

## High (8 findings)

Features that are silently broken, or data that reaches more people than it should.

### H1 · Every logged-in user can subscribe to the live fleet channel

**High** · Where: `routes/channels.php:9`

The `fleet` channel callback returns `true` for everyone, so any driver can watch every vehicle's position and speed in real time.

**Change:** Return `$user->role !== 'driver'`, or check against an explicit list of allowed roles.

### H2 · The `view-vehicles` gate is never defined, so this API route always returns 403

**High** · Where: `api.php:24`

`GET /api/fleet/vehicles/locations` uses `can:view-vehicles`, but nothing in the codebase defines that gate. Laravel denies undefined gates, so every caller gets 403.

**Change:** Define the gate in `AppServiceProvider`, or switch the route to the `role` middleware.

### H3 · The scheduler never runs in the container, so expiry reminders never go out

**High** · Where: `docker/supervisord.conf`, `routes/console.php`

> **Status:** fixed in the working copy (`docker/supervisord.conf` now runs `schedule:work` as `www-data`). Not yet committed or deployed.

`app:check-document-expiries` is scheduled to run daily, but supervisord starts php-fpm, nginx, the queue workers and Reverb, and nothing runs `schedule:work`. The 30-, 14- and 1-day warnings for insurance, roadworthiness and licences are never sent.

```ini
[program:laravel-scheduler]
command=php /var/www/html/artisan schedule:work
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
redirect_stderr=true
```

### H4 · Expiry alerts show "Unknown", and drivers are never emailed about their own documents

**High** · Where: `DashboardController@index`, `@compliance`, `CheckDocumentExpiries.php:40`

Documents are stored with the morph alias `App\Models\Vehicle`, but these checks compare against `Vehicle::class`, which is `App\Domains\Fleet\Models\Vehicle`. The comparison never matches. As a result the dashboard and the compliance list show every entity as "Unknown", and the expiry command never finds a driver's email address.

**Change:** Test the loaded model (`$doc->documentable instanceof Vehicle`) instead of the raw type string.

### H5 · Opening the Vehicles page runs two UPDATE queries every time

**High** · Where: `DashboardController@vehicles :118 "SILENT FIX"`, `importCompliance :1415`

The patch rewrites `documentable_type` on every page view. It exists because `importCompliance` still saves `Vehicle::class` instead of the morph alias. It's a data fix running inside a read request.

**Change:** Make `importCompliance` use `getMorphClass()`, as `storeCompliance` already does. Move the rewrite into a one-off migration, then delete the patch.

### H6 · The queue workers are running, but nothing is sent to them

**High** · Where: `ProcessVehicleLocation`, `TelematicsService`, `DriverTrackingService`, `notify*Decision`, `sendInvoiceEmail`

`ProcessVehicleLocation` implements `ShouldQueue`, but every caller runs it inline with `(new …)->handle()`. Each GPS ping therefore does the insert, the geofence scan and the broadcast inside the HTTP request. Approval emails use `Mail::send` after the status is saved, so an SMTP failure returns a 500 even though the decision was recorded.

**Change:** Use `ProcessVehicleLocation::dispatch(…)` and `Mail::queue(…)`, and add `ShouldQueue` to the notification classes. The two supervisord workers are already there to process them.

### H7 · Driver licences and vehicle papers are stored as permanent public links

**High** · Where: `storeCompliance`, `storeDriver (passport_photo)`, `ChatController (images)`

Uploads to R2 save `Storage::disk('r2')->url($path)`. If the bucket or its public domain is open, anyone with a link can view the ID documents, forever.

**Change:** Keep the bucket private and store only the path. Serve files through an authenticated route that redirects to `temporaryUrl($path, now()->addMinutes(10))`.

### H8 · Mobile API tokens never expire and are never revoked

**High** · Where: `config/sanctum.php:53`, `AuthenticationService`

`expiration` is `null`, and every mobile login creates a new token without deleting the old ones. A lost phone keeps working access indefinitely.

**Change:** Set an expiration (for example 30 days), delete earlier `mobile-app-driver` tokens on login, and give admins a "sign out this driver's devices" action.

---

## Medium (8 findings)

Bugs and edge cases that will produce wrong data or confusing errors.

### M1 · An admin can approve a request they created

**Medium** · Where: `actionMaintenance`, `actionFuel`, `resubmit*`

An admin who raises a request under ₦20,000 can approve it themselves, because nothing compares `created_by` with the reviewer. On top of that, any user can resubmit any rejected request, not just the person who raised it.

**Change:** Block reviewers from acting on their own requests. Limit resubmission to the creator or an admin.

### M2 · Ending a trip hides validation errors, and the route is registered twice

**Medium** · Where: `endTrip :511`, `web.php:78 & :83`

`catch (\Exception)` also catches `ValidationException`, so bad input comes back as a generic flash message instead of field errors. The two `PUT /dashboard/trips/{…}/end` routes share the same URI, so the second one replaces the first.

**Change:** Delete the "direct" route. Delete the try/catch and let Laravel handle the errors.

### M3 · Vehicle labels still read `make` and `model`, which are now empty

**Medium** · Where: `financialReports :1753`, `index()`, `DriverTrackingService`, `CheckDocumentExpiries`

The August restructure made `name` the main vehicle field and made make and model nullable. The vehicle filter in financial reports, the map payload, the driver app's vehicle info and the expiry emails still use the old fields. For newly imported vehicles, those labels come out blank.

### M4 · Vehicle codes like `veh012` can be duplicated

**Medium** · Where: `Vehicle.php:30`

The `creating` hook guesses the next ID as the last ID plus one. Two imports running at the same moment get the same code. Deleting the newest vehicle means the next one reuses its code.

**Change:** Set the code in a `created` hook from the vehicle's own ID, and add a unique index on the column.

### M5 · A bad date in the Reports URL causes a server error

**Medium** · Where: `reports :1688–1689`

A bad `?start=` value is passed straight into `Carbon::parse`, which throws, and the page returns a 500. Validate the filters with `date` rules first. The same applies to the `year` and `month` filters on financial reports.

### M6 · Documents can be attached to vehicles or drivers that don't exist

**Medium** · Where: `storeCompliance :1518`

`documentable_id` is only checked to be an integer. Check that the vehicle or driver actually exists, based on `documentable_type`.

### M7 · Imported drivers get the password "password"

**Medium** · Where: `importDrivers :1250`

Any CSV row without a password column creates a login with a password everyone can guess. Instead, generate a random password and email a reset link.

### M8 · Exception codes are used as HTTP status codes

**Medium** · Where: `TelematicsController`, `AuthController`

`$e->getCode()` becomes the response status. A database error has the code `"23000"`, which isn't a valid HTTP status, so building the response throws a second error. The raw exception message is also sent back to the client. Use small custom exception classes, such as `TrackingDisabled` and `InvalidCredentials`, and map each one to a status code.

---

## Structure & deploy (12 suggestions)

Nothing here is broken today, but each item makes the next feature slower or the next deploy riskier.

### S1 · Split up the 1,841-line `DashboardController`

**Structure**

It handles 12 areas: vehicles, drivers, trips, maintenance, fuel, compliance, vendors, departments, users, reports, finance and the approval desk. You already have `app/Domains/*`, so give each domain its own controller there, and move the validation into Form Request classes. That makes each area testable on its own.

### S2 · One approval workflow instead of two copies

**Structure**

`actionMaintenance` and `actionFuel` are near-identical blocks of about 150 lines each, including the notifications. Move them into one `ApprovalService` with explicit states (Pending → Under Review → Accepted/Rejected). Read the threshold from config, e.g. `config('approvals.superadmin_threshold', 20000)`, instead of the hard-coded `> 20000` in two places.

### S3 · Pick one spelling for the superadmin role

**Structure**

`'superadmin'` and `'super_admin'` are both checked, with `super_admin` appearing on 38 lines in `app/`. Create a PHP `Role` enum with helpers like `$user->isSuperAdmin()`, and migrate the existing rows to a single value.

### S4 · Keep office coordinates in one config file

**Structure**

The Lagos, Abuja and Ibadan coordinates are hard-coded in three places, and the lists don't match: the CSV import has no Port Harcourt or Kano. Move them to `config/locations.php`.

### S5 · Paginate the big lists

**Structure**

Maintenance, Fuel, the Approval Desk, Compliance and Users all load every row with `->get()`. Trips already uses `paginate(50)`. Do the same on the other pages before fuel logs reach the thousands.

### S6 · Cut the query run on every page load

**Structure**

`HandleInertiaRequests` runs `Setting::all()` and an unread-notification count on every request, and sends the full user model, `push_token` included, to the browser. Cache the settings and share only `id`, `name`, `email` and `role`.

### D1 · Pass the `VITE_*` variables into the Docker build

**Deploy**

Vite compiles these in at build time, and the frontend build stage never receives them. As a result, Echo never connects and the map API keys are empty. Add `ARG`/`ENV` lines for `VITE_REVERB_*`, `VITE_GOOGLE_MAPS_API_KEY` and `VITE_MAPBOX_TOKEN` before `npm run build`, then set them as build arguments in Dokploy.

### D2 · Add a `.env.example`

**Deploy**

The `composer setup` script copies it, but the file doesn't exist, so setup fails on a fresh clone. Commit one with placeholder values. That's also where the real keys from C3 should have lived.

### D3 · Make failed deploys visible

**Deploy**

The entrypoint runs `migrate --force || echo …`, so a failed migration still boots the app against the wrong schema. Let it fail. Add `HEALTHCHECK CMD curl -fs http://localhost/up` so Dokploy can tell whether the container is actually healthy. The docs say PHP 8.5 but the image is 8.4; pick one.

### D4 · Replace `xlsx@0.18.5`

**Deploy**

This npm release has published security advisories (prototype pollution and ReDoS), and SheetJS no longer publishes updates to npm. Your usage is export-only, which lowers the risk. Still, switch to SheetJS's own CDN build or to `exceljs`.

### D5 · Add `axios` as a direct dependency

**Deploy**

`bootstrap.js` imports axios, but `package.json` doesn't list it. It currently arrives as a dependency of another package, and would break if that package drops it.

### D6 · Only load the map library that's selected

**Deploy**

The bundle includes `mapbox-gl`, `maplibre-gl` and the Google Maps SDK, but only one is used at a time, depending on `map_provider`. Load the selected one with a dynamic `import()`. It's the biggest bundle saving available.

---

## Tests & what's solid

The only tests are the Breeze defaults for auth and profile. Everything specific to the fleet business is untested.

### First tests worth writing

- A role matrix: each route against driver, manager, admin, superadmin and accountant (this catches C5 and would have prevented C1)
- The approval paths: at ₦19,999 an admin accepts directly; at ₦20,001 it goes to a Super Admin, then gets accepted or rejected
- The trip compliance gate: a missing or expired Roadworthiness document blocks `storeTrip`
- Telematics: a driver can't post for another vehicle, and a wrong OsmAnd secret returns 403
- The expiry command sends at 30, 14 and 1 days, and not on other days

### Already done well

- Trip creation is blocked unless the vehicle and driver have valid, current documents
- The two-tier approval flow has clear states and notifies each role involved
- Chat checks conversation membership on both read and send, and its channel is private
- The driver auto-ping takes the vehicle from the active trip, which is the right pattern for C6
- Mobile login is rate-limited, TOTP 2FA is in place, and `trustProxies` is set correctly for Traefik

---

*Reviewed from the local working copy (commit `1444c20`). Line numbers refer to that commit. The review only read the code. Since then, H3 has been fixed in the working copy.*
