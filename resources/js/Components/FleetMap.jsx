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

    const renderDriverMarker = (vehicle, isGoogleMaps = false) => {
        const hasDriver = !!vehicle.active_driver;
        const initials = hasDriver ? vehicle.active_driver.substring(0, 2).toUpperCase() : '';

        const markerContent = (
            <div className="flex flex-col items-center">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center 
                    cursor-pointer shadow-lg transition-transform hover:scale-110
                    ${hasDriver
                        ? 'bg-emerald-500 shadow-emerald-500/50 ring-2 ring-emerald-400/50'
                        : 'bg-gray-500 shadow-gray-500/30 ring-2 ring-gray-400/30'}
                `}>
                    {hasDriver ? (
                        <span className="text-white text-xs font-bold">{initials}</span>
                    ) : (
                        <Car className="w-5 h-5 text-white" />
                    )}
                </div>
                {hasDriver && (
                    <span className="mt-1 px-2 py-0.5 bg-black/70 text-white text-[10px] 
                                   font-medium rounded-full whitespace-nowrap backdrop-blur-sm
                                   border border-white/10 shadow-lg">
                        {vehicle.active_driver}
                    </span>
                )}
                {!hasDriver && (
                    <span className="mt-1 px-2 py-0.5 bg-gray-800/70 text-gray-400 text-[10px] 
                                   font-medium rounded-full whitespace-nowrap backdrop-blur-sm
                                   border border-white/5">
                        Idle
                    </span>
                )}
            </div>
        );

        if (isGoogleMaps) {
            return (
                <AdvancedMarker
                    key={vehicle.id}
                    position={{ lat: parseFloat(vehicle.latitude), lng: parseFloat(vehicle.longitude) }}
                    onClick={() => onSelectVehicle(vehicle)}
                >
                    {markerContent}
                </AdvancedMarker>
            );
        }

        return (
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
                {markerContent}
            </MapLibreMarker>
        );
    };

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
                        {vehicles.filter(v => v.latitude && v.longitude).map(vehicle =>
                            renderDriverMarker(vehicle, true)
                        )}
                    </GoogleMap>
                </APIProvider>
            ) : (
                <MapLibreMap
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                >
                    <NavigationControl position="bottom-right" />

                    {vehicles.filter(v => v.latitude && v.longitude).map(vehicle =>
                        renderDriverMarker(vehicle, false)
                    )}
                </MapLibreMap>
            )}
        </div>
    );
}