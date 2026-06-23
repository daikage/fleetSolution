import { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Car } from 'lucide-react';

export default function FleetMap({ vehicles, onSelectVehicle }) {
    // Default viewport over Lagos, Nigeria
    const [viewState, setViewState] = useState({
        longitude: 3.3792,
        latitude: 6.5244,
        zoom: 11
    });

    return (
        <div className="absolute inset-0">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            >
                <NavigationControl position="bottom-right" />
                
                {vehicles.map(vehicle => (
                    <Marker
                        key={vehicle.id}
                        longitude={vehicle.longitude}
                        latitude={vehicle.latitude}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation();
                            onSelectVehicle(vehicle);
                        }}
                    >
                        <div className="bg-electric-blue w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-electric-blue/50 hover:scale-110 transition-transform">
                            <Car className="w-4 h-4 text-white" />
                        </div>
                    </Marker>
                ))}
            </Map>
        </div>
    );
}
