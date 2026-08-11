<?php

namespace App\Providers;

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
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Maintain backwards compatibility for polymorphic relationships in the DB
        // since we refactored models from App\Models to App\Domains\...
        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'App\Models\User' => \App\Domains\Identity\Models\User::class,
            'App\Models\Vehicle' => \App\Domains\Fleet\Models\Vehicle::class,
            'App\Models\Driver' => \App\Domains\Driver\Models\Driver::class,
            'App\Models\Trip' => \App\Domains\Driver\Models\Trip::class,
            'App\Models\FuelLog' => \App\Domains\Telematics\Models\FuelLog::class,
            'App\Models\Maintenance' => \App\Domains\Maintenance\Models\Maintenance::class,
            'App\Models\Location' => \App\Domains\Telematics\Models\Location::class,
            'App\Models\Setting' => \App\Domains\Identity\Models\Setting::class,
            'App\Models\Document' => \App\Domains\Fleet\Models\Document::class,
        ]);
    }
}
