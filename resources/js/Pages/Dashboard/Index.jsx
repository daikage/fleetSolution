import { useState, useEffect } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import FleetMap from '@/Components/FleetMap';
import VehicleSidebar from '@/Components/VehicleSidebar';
import { Head } from '@inertiajs/react';

export default function Index({ initialVehicles }) {
    const [vehicles, setVehicles] = useState(initialVehicles || []);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    useEffect(() => {
        if (!window.Echo) return;
        
        // Listen to Reverb WebSockets for location updates
        const channel = window.Echo.private('fleet');
        
        channel.listen('VehicleLocationUpdated', (e) => {
            const newLocation = e.location;
            setVehicles(current => current.map(v => 
                v.id === newLocation.vehicle_id 
                ? { ...v, latitude: newLocation.latitude, longitude: newLocation.longitude, speed: newLocation.speed }
                : v
            ));
            
            // Update selected vehicle if it's the one that moved
            setSelectedVehicle(current => 
                current && current.id === newLocation.vehicle_id 
                ? { ...current, latitude: newLocation.latitude, longitude: newLocation.longitude, speed: newLocation.speed }
                : current
            );
        });
            
        return () => {
            window.Echo.leaveChannel('fleet');
        };
    }, []);

    return (
        <DashboardLayout>
            <Head title="Fleet Command Center" />
            
            <FleetMap 
                vehicles={vehicles} 
                onSelectVehicle={setSelectedVehicle} 
            />
            
            <VehicleSidebar 
                vehicle={selectedVehicle} 
                onClose={() => setSelectedVehicle(null)} 
            />
        </DashboardLayout>
    );
}
