<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mandatory Compliance Documents
    |--------------------------------------------------------------------------
    |
    | This configuration defines which document types are mandatory for vehicles
    | and drivers. The system enforces these in the trip workflow
    | (DashboardController@storeTrip) by blocking the creation of an active trip
    | if any document is missing, expired, or not yet verified. The same list
    | powers the "Missing Mandatory Documents" panel on the Compliance page.
    |
    | A vehicle/driver can only be set as active on a trip when it holds a valid,
    | verified, non-expired copy of every document listed below.
    |
    */

    'vehicle' => [
        'Vehicle License',
        'Roadworthiness',
    ],

    'driver' => [
        'Driver License',
    ],

];
