<?php

namespace App\Providers;

use App\Domains\Driver\Models\Driver;
use App\Domains\Driver\Models\Trip;
use App\Domains\Fleet\Models\Document;
use App\Domains\Fleet\Models\Vehicle;
use App\Domains\Identity\Models\Setting;
use App\Domains\Identity\Models\User;
use App\Domains\Maintenance\Models\Maintenance;
use App\Domains\Telematics\Models\FuelLog;
use App\Domains\Telematics\Models\Location;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Maintain backwards compatibility for polymorphic relationships in the DB
        // since we refactored models from App\Models to App\Domains\...
        Relation::morphMap([
            'App\Models\User' => User::class,
            'App\Models\Vehicle' => Vehicle::class,
            'App\Models\Driver' => Driver::class,
            'App\Models\Trip' => Trip::class,
            'App\Models\FuelLog' => FuelLog::class,
            'App\Models\Maintenance' => Maintenance::class,
            'App\Models\Location' => Location::class,
            'App\Models\Setting' => Setting::class,
            'App\Models\Document' => Document::class,
        ]);
    }
}
