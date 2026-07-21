<!DOCTYPE html>
<html>
<head>
    <title>Fuel Request Decision</title>
</head>
<body>
    <h2>Your Fuel Request has been {{ $fuelLog->status }}</h2>
    
    <p><strong>Vehicle:</strong> {{ $fuelLog->vehicle->make }} {{ $fuelLog->vehicle->model }} ({{ $fuelLog->vehicle->license_plate }})</p>
    <p><strong>Liters:</strong> {{ $fuelLog->liters }} L</p>
    <p><strong>Cost:</strong> ₦{{ number_format($fuelLog->cost, 2) }}</p>
    <p><strong>Date:</strong> {{ $fuelLog->date->format('M d, Y') }}</p>
    
    @if($fuelLog->reviewer_comment)
        <h3>Reviewer Comment:</h3>
        <p><em>"{{ $fuelLog->reviewer_comment }}"</em></p>
    @endif
    
    <p>Please contact the admin if you have any questions.</p>
</body>
</html>
