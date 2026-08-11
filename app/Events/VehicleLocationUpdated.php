<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Domains\Telematics\Models\Location;

class VehicleLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $location;
    public $driver;

    /**
     * Create a new event instance.
     */
    public function __construct(Location $location, $driver = null)
    {
        $this->location = $location;
        $this->driver = $driver;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('fleet'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'vehicle_id' => $this->location->vehicle_id,
            'latitude' => $this->location->latitude,
            'longitude' => $this->location->longitude,
            'speed' => $this->location->speed,
            'driver' => $this->driver,
            'timestamp' => $this->location->created_at,
        ];
    }
}
