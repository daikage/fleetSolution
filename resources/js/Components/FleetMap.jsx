import { useState } from 'react';
import MapLibreMap, { Marker as MapLibreMarker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Car } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';

export default function FleetMap({ vehicles, onSelectVehicle }) {
    const { props } = usePage();
    const mapProvider = props.settings?.map_provider || 'map_libre';

    const [viewState, setViewState] = useState({
        longitude: 3.3792,
        latitude: 6.5244,
        zoom: 11
    });

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    return (
        <div className="absolute inset-0">
            {mapProvider === 'google_maps' ? (
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        defaultCenter={{ lat: viewState.latitude, lng: viewState.longitude }}
                        defaultZoom={viewState.zoom}
                        mapId="DEMO_MAP_ID"
                        onCameraChanged={(ev) => setViewState({
                            longitude: ev.detail.center.lng,
                            latitude: ev.detail.center.lat,
                            zoom: ev.detail.zoom
                        })}
                        disableDefaultUI={true}
                    >
                        {vehicles.filter(v => v.latitude && v.longitude).map(vehicle => (
                            <AdvancedMarker
                                key={vehicle.id}
                                position={{ lat: parseFloat(vehicle.latitude), lng: parseFloat(vehicle.longitude) }}
                                onClick={() => onSelectVehicle(vehicle)}
                            >
                                <div className="bg-electric-blue w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-electric-blue/50 hover:scale-110 transition-transform">
                                    <Car className="w-4 h-4 text-white" />
                                </div>
                            </AdvancedMarker>
                        ))}
                    </GoogleMap>
                </APIProvider>
            ) : (
                <MapLibreMap
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                >
                    <NavigationControl position="bottom-right" />
                    
                    {vehicles.filter(v => v.latitude && v.longitude).map(vehicle => (
                        <MapLibreMarker
                            key={vehicle.id}
                            longitude={parseFloat(vehicle.longitude)}
                            latitude={parseFloat(vehicle.latitude)}
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                onSelectVehicle(vehicle);
                            }}
                        >
                            <div className="bg-electric-blue w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-electric-blue/50 hover:scale-110 transition-transform">
                                <Car className="w-4 h-4 text-white" />
                            </div>
                        </MapLibreMarker>
                    ))}
                </MapLibreMap>
            )}
        </div>
    );
}
