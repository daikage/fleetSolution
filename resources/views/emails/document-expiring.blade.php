<!DOCTYPE html>
<html>
<head>
    <title>Document Expiring Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Compliance Notice: Document Expiring Soon</h2>
    
    <p>This is an automated reminder that the following document is nearing its expiration date and requires your attention.</p>
    
    <ul>
        <li><strong>Entity:</strong> {{ $documentData['entity_name'] }}</li>
        <li><strong>Document Type:</strong> {{ $documentData['document_type'] }}</li>
        <li><strong>Expiry Date:</strong> {{ $documentData['expiry_date'] }}</li>
        <li><strong>Days Remaining:</strong> {{ $documentData['days_remaining'] }} days</li>
    </ul>

    <p>Please ensure this document is renewed and uploaded to the compliance portal before the expiration date. 
    Failure to renew mandatory documents may result in the automatic blocking of the vehicle or driver from participating in active trips.</p>

    <br>
    <p>Thank you,</p>
    <p>FKG.Fleet Management System</p>
</body>
</html>
