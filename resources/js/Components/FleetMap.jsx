import { useState } from 'react';
import MapLibreMap, { Marker as MapLibreMarker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Car, User, Filter } from 'lucide-react';
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

    const [filter, setFilter] = useState('all'); // 'all' | 'drivers' | 'vehicles'

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const filteredVehicles = vehicles.filter(v => v.latitude && v.longitude).filter(vehicle => {
        if (filter === 'drivers') return !!vehicle.active_driver;
        if (filter === 'vehicles') return !vehicle.active_driver;
        return true;
    });

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
            {/* Filter Controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-2xl">
                    <Filter className="w-4 h-4 text-gray-400 ml-2" />
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${filter === 'all'
                                ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        All ({vehicles.filter(v => v.latitude && v.longitude).length})
                    </button>
                    <button
                        onClick={() => setFilter('drivers')}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${filter === 'drivers'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        Drivers ({vehicles.filter(v => v.active_driver && v.latitude && v.longitude).length})
                    </button>
                    <button
                        onClick={() => setFilter('vehicles')}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${filter === 'vehicles'
                                ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <Car className="w-3.5 h-3.5" />
                        Vehicles ({vehicles.filter(v => !v.active_driver && v.latitude && v.longitude).length})
                    </button>
                </div>
            </div>

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
                        style={{ width: '100%', height: '100%' }}
                    >
                        {filteredVehicles.map(vehicle =>
                            renderDriverMarker(vehicle, true)
                        )}
                    </GoogleMap>
                </APIProvider>
            ) : (
                <MapLibreMap
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapStyle={mapProvider === 'mapbox' 
                        ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}` 
                        : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"}
                    style={{ width: '100%', height: '100%' }}
                >
                    <NavigationControl position="bottom-right" />

                    {filteredVehicles.map(vehicle =>
                        renderDriverMarker(vehicle, false)
                    )}
                </MapLibreMap>
            )}
        </div>
    );
}