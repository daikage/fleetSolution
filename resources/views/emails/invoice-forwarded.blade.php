<!DOCTYPE html>
<html>
<head>
    <title>Invoice — {{ $recordType }} Request #{{ $record->id }}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; }
        .invoice-container { max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: white; padding: 24px; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 4px 0 0; opacity: 0.9; font-size: 14px; }
        .body { padding: 24px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .detail-label { font-weight: bold; color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-value { color: #111; font-size: 14px; }
        .total-row { background: #f8fafc; padding: 16px 24px; border-top: 2px solid #0ea5e9; }
        .total-row .amount { font-size: 24px; font-weight: bold; color: #0ea5e9; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-accepted { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef9c3; color: #854d0e; }
        .status-rejected { background: #fecaca; color: #991b1b; }
        .status-review { background: #dbeafe; color: #1e40af; }
        .footer { padding: 16px 24px; background: #f8fafc; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        .vendors-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .vendors-table th, .vendors-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
        .vendors-table th { background: #f8fafc; color: #555; font-weight: bold; text-transform: uppercase; font-size: 11px; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <h1>FKG.Fleet — Invoice</h1>
            <p>{{ $recordType }} Request #{{ $record->id }}</p>
        </div>

        <div class="body">
            <p style="margin-top: 0;">This invoice was forwarded by <strong>{{ $senderName }}</strong> from the Finance team.</p>

            <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value">{{ $recordType }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value">
                    @php
                        $statusClass = match(strtolower($record->status)) {
                            'accepted' => 'status-accepted',
                            'rejected' => 'status-rejected',
                            'under review' => 'status-review',
                            default => 'status-pending',
                        };
                    @endphp
                    <span class="status-badge {{ $statusClass }}">{{ $record->status }}</span>
                </span>
            </div>

            @if($record->vehicle)
            <div class="detail-row">
                <span class="detail-label">Vehicle</span>
                <span class="detail-value">{{ $record->vehicle->make ?? '' }} {{ $record->vehicle->model ?? '' }} ({{ $record->vehicle->license_plate ?? 'N/A' }})</span>
            </div>
            @endif

            <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">{{ $record->date ? $record->date->format('M d, Y') : 'N/A' }}</span>
            </div>

            @if($recordType === 'Maintenance')
                <div class="detail-row">
                    <span class="detail-label">Service Type</span>
                    <span class="detail-value">{{ $record->service_type ?? 'N/A' }}</span>
                </div>

                @if($record->diagnosis)
                <div class="detail-row">
                    <span class="detail-label">Diagnosis</span>
                    <span class="detail-value">{{ $record->diagnosis }}</span>
                </div>
                @endif

                @if($record->work_to_be_done)
                <div class="detail-row">
                    <span class="detail-label">Work To Be Done</span>
                    <span class="detail-value">{{ $record->work_to_be_done }}</span>
                </div>
                @endif

                @if($record->vendors && $record->vendors->count() > 0)
                <div style="padding: 12px 0;">
                    <span class="detail-label">Vendors</span>
                    <table class="vendors-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Price (₦)</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($record->vendors as $vendor)
                            <tr>
                                <td>{{ $vendor->vendor_name }}</td>
                                <td>₦{{ number_format($vendor->vendor_price, 2) }}</td>
                                <td>{{ $vendor->additional_comments ?? '—' }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                @endif
            @else
                <div class="detail-row">
                    <span class="detail-label">Liters</span>
                    <span class="detail-value">{{ $record->liters }} L</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Odometer at Fill</span>
                    <span class="detail-value">{{ number_format($record->odometer_at_fill) }} km</span>
                </div>
            @endif

            @if($record->reviewer_comment)
            <div class="detail-row">
                <span class="detail-label">Reviewer Comment</span>
                <span class="detail-value"><em>"{{ $record->reviewer_comment }}"</em></span>
            </div>
            @endif
        </div>

        <div class="total-row">
            <span class="detail-label">Total Cost</span><br>
            <span class="amount">₦{{ number_format($record->cost, 2) }}</span>
        </div>

        <div class="footer">
            <p>This invoice was generated and forwarded by the FKG.Fleet finance team. For questions, please contact the finance department.</p>
            <p style="margin-bottom: 0;">FKG.Fleet Management System</p>
        </div>
    </div>
</body>
</html>
