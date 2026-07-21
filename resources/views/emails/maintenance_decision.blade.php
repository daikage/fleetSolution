<!DOCTYPE html>
<html>
<head>
    <title>Maintenance Request Decision</title>
</head>
<body>
    <h2>Your Maintenance Request has been {{ $maintenance->status }}</h2>
    
    <p><strong>Vehicle:</strong> {{ $maintenance->vehicle->make }} {{ $maintenance->vehicle->model }} ({{ $maintenance->vehicle->license_plate }})</p>
    <p><strong>Service Type:</strong> {{ $maintenance->service_type }}</p>
    <p><strong>Cost:</strong> ₦{{ number_format($maintenance->cost, 2) }}</p>
    <p><strong>Date:</strong> {{ $maintenance->date->format('M d, Y') }}</p>
    
    @if($maintenance->reviewer_comment)
        <h3>Reviewer Comment:</h3>
        <p><em>"{{ $maintenance->reviewer_comment }}"</em></p>
    @endif
    
    <p>Please contact the admin if you have any questions.</p>
</body>
</html>
