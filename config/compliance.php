<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mandatory Compliance Documents
    |--------------------------------------------------------------------------
    |
    | This configuration defines which document types are mandatory for vehicles
    | and drivers. The system will use this to block trips if these documents
    | are missing, expired, or pending verification.
    |
    */

    'vehicle' => [
        'Insurance',
        'Roadworthiness',
        'Vehicle License',
    ],

    'driver' => [
        'Driver License',
    ],

];
