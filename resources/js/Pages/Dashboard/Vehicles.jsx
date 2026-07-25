import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import BulkImportModal from '@/Components/BulkImportModal';
import { Plus, Settings, Trash2, X, Navigation, FileText, File as FileIcon, ChevronDown, ChevronUp, StopCircle, XCircle, MapPin, Search, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Google Places Autocomplete component (must be inside APIProvider)
function PlacesAutocomplete({ onPlaceSelected, searchQuery, setSearchQuery }) {
    const inputRef = useRef(null);
    const placesLib = useMapsLibrary('places');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const sessionTokenRef = useRef(null);

    useEffect(() => {
        if (!placesLib) return;
        // Create a session token for autocomplete sessions
        if (!sessionTokenRef.current) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
    }, [placesLib]);

    // Fetch predictions as user types
    useEffect(() => {
        if (!placesLib || !searchQuery.trim() || searchQuery.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const autocompleteService = new placesLib.AutocompleteService();
        const timeout = setTimeout(() => {
            autocompleteService.getPlacePredictions(
                {
                    input: searchQuery,
                    types: ['establishment', 'geocode', 'address'],
                    sessionToken: sessionTokenRef.current,
                },
                (predictions, status) => {
                    if (status === placesLib.PlacesServiceStatus.OK && predictions) {
                        setSuggestions(predictions);
                        setShowSuggestions(true);
                    } else {
                        setSuggestions([]);
                    }
                }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery, placesLib]);

    const selectSuggestion = (prediction) => {
        setShowSuggestions(false);
        setSearchQuery(prediction.description);

        if (!placesLib) return;

        const placesService = new placesLib.PlacesService(document.createElement('div'));
        placesService.getDetails(
            {
                placeId: prediction.place_id,
                fields: ['geometry', 'formatted_address', 'name'],
            },
            (place, status) => {
                if (status === placesLib.PlacesServiceStatus.OK && place.geometry) {
                    onPlaceSelected(
                        place.geometry.location.lat(),
                        place.geometry.location.lng(),
                        place.formatted_address || place.name || ''
                    );
                }
            }
        );
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) {
                        setShowSuggestions(false);
                    }
                }}
                onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                    // Delay hiding so click on suggestion registers
                    setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search for any business, address, or landmark..."
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none placeholder-gray-500"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                    {suggestions.map((prediction) => (
                        <button
                            key={prediction.place_id}
                            type="button"
                            onMouseDown={() => selectSuggestion(prediction)}
                            className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2"
                        >
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-electric-blue flex-shrink-0" />
                            <div>
                                <div className="font-medium">{prediction.structured_formatting?.main_text || prediction.description}</div>
                                {prediction.structured_formatting?.secondary_text && (
                                    <div className="text-gray-400 text-[11px]">{prediction.structured_formatting.secondary_text}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Vehicles({ vehicles, drivers }) {
    const { props } = usePage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [expandedVehicleId, setExpandedVehicleId] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Map location picker state
    const [mapLocation, setMapLocation] = useState({
        latitude: 6.5244,
        longitude: 3.3792,
    });
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResultAddress, setSearchResultAddress] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        make: '',
        model: '',
        year: '',
        vin: '',
        license_plate: '',
        odometer: '',
        vendor: '',
        driver_id: '',
        latitude: '',
        longitude: '',
    });

    const dispatchForm = useForm({
        vehicle_id: '',
        driver_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dashboard.vehicles'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const submitDispatch = (e) => {
        e.preventDefault();
        dispatchForm.post(route('dashboard.trips.store'), {
            onSuccess: () => {
                setIsDispatchModalOpen(false);
                dispatchForm.reset();
                setSelectedVehicle(null);
            },
        });
    };

    // Handle a place selected from autocomplete or geocoding
    const handlePlaceSelected = useCallback((lat, lng, address) => {
        setMapLocation({ latitude: lat, longitude: lng });
        setData('latitude', lat.toString());
        setData('longitude', lng.toString());
        if (address) setSearchResultAddress(address);
        setShowMapPicker(true);
        setIsGeocoding(false);
    }, [setData]);

    // Fallback geocoding via Nominatim when Google Places is not available
    const geocodeWithNominatim = useCallback(async (query) => {
        setIsGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const results = await res.json();
            if (results && results.length > 0) {
                const loc = results[0];
                handlePlaceSelected(parseFloat(loc.lat), parseFloat(loc.lon), loc.display_name);
            }
        } catch (err) {
            console.warn('Geocoding failed:', err);
        } finally {
            setIsGeocoding(false);
        }
    }, [handlePlaceSelected]);

    const sortedVehicles = [...vehicles].sort((a, b) => {
        const vendorA = a.vendor || 'Z_No_Vendor';
        const vendorB = b.vendor || 'Z_No_Vendor';
        return vendorA.localeCompare(vendorB);
    });

    const exportColumns = [
        { header: 'Vendor', key: 'vendor' },
        { header: 'Make', key: 'make' },
        { header: 'Model', key: 'model' },
        { header: 'Year', key: 'year' },
        { header: 'License Plate', key: 'license_plate' },
        { header: 'VIN', key: 'vin' },
        { header: 'Odometer (mi)', key: 'odometer' },
        { header: 'Status', key: 'status' }
    ];

    const exportData = sortedVehicles.map(v => ({
        ...v,
        vendor: v.vendor || 'N/A'
    }));

    const toggleExpand = (id) => {
        setExpandedVehicleId(expandedVehicleId === id ? null : id);
    };

    return (
        <DashboardLayout>
            <Head title="Vehicles - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Vehicles</h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Manage your fleet registry and vendors</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-full font-medium transition-colors border border-white/10 flex items-center gap-2 whitespace-nowrap"
                        >
                            <FileText className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                            <span className="inline">Import Bulk</span>
                        </button>
                        <ExportButtons data={exportData} columns={exportColumns} filename="Fleet_Vehicles" title="Fleet Vehicles Registry" />
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-electric-blue hover:bg-sky-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            Add Vehicle
                        </button>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300 w-10"></th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Vendor</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Vehicle</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">License Plate</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Odometer</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedVehicles.map((vehicle, index) => {
                                    const isExpanded = expandedVehicleId === vehicle.id;
                                    const showVendorGroupHeader = index === 0 || sortedVehicles[index - 1].vendor !== vehicle.vendor;

                                    return (
                                        <React.Fragment key={vehicle.id}>
                                            {showVendorGroupHeader && (
                                                <tr className="bg-white/5 border-b border-white/10">
                                                    <td colSpan="7" className="p-2 px-4 text-xs font-semibold text-electric-blue uppercase tracking-wider">
                                                        {vehicle.vendor || 'No Vendor'}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isExpanded ? 'bg-white/5' : ''}`}>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => toggleExpand(vehicle.id)} className="text-gray-400 hover:text-white transition-colors">
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-gray-300 text-sm font-medium">{vehicle.vendor || 'N/A'}</td>
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{vehicle.make} {vehicle.model}</div>
                                                    <div className="text-sm text-gray-400">{vehicle.year} • {vehicle.vin}</div>
                                                </td>
                                                <td className="p-4 text-gray-300">{vehicle.license_plate}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${vehicle.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        vehicle.status === 'in_shop' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                        }`}>
                                                        {vehicle.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-300">{vehicle.odometer.toLocaleString()} mi</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!vehicle.currentTrip ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedVehicle(vehicle);
                                                                    dispatchForm.setData('vehicle_id', vehicle.id);
                                                                    setIsDispatchModalOpen(true);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-emerald-400 bg-white/5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                                                                title="Start Trip"
                                                            >
                                                                <Navigation className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <Link
                                                                    href={route('dashboard.trips.end', vehicle.currentTrip.id)}
                                                                    method="put"
                                                                    as="button"
                                                                    className="p-2 text-gray-400 hover:text-amber-400 bg-white/5 rounded-lg hover:bg-amber-500/10 transition-colors"
                                                                    title="End Trip"
                                                                >
                                                                    <StopCircle className="w-4 h-4" />
                                                                </Link>
                                                                <Link
                                                                    href={route('dashboard.trips.destroy', vehicle.currentTrip.id)}
                                                                    method="delete"
                                                                    as="button"
                                                                    className="p-2 text-gray-400 hover:text-rose-400 bg-white/5 rounded-lg hover:bg-rose-500/10 transition-colors"
                                                                    title="Cancel Trip"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </Link>
                                                            </>
                                                        )}
                                                        <Link
                                                            href={route('dashboard.vehicles.destroy', vehicle.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="p-2 text-gray-400 hover:text-rose-400 bg-white/5 rounded-lg hover:bg-rose-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-black/20 border-b border-white/5">
                                                    <td colSpan="7" className="p-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                                                    <FileIcon className="w-4 h-4" /> Compliance Documents
                                                                </h4>
                                                                {vehicle.documents && vehicle.documents.length > 0 ? (
                                                                    <ul className="space-y-2">
                                                                        {vehicle.documents.map(doc => (
                                                                            <li key={doc.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                                                                <span className="text-white font-medium text-sm">{doc.document_type}</span>
                                                                                <span className={`text-xs px-2 py-1 rounded-full ${new Date(doc.expiry_date) < new Date() ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                                                    Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                                                                </span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-gray-500 text-sm italic">No compliance documents uploaded.</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Vehicle Details</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between p-2 border-b border-white/5"><span className="text-gray-400">VIN</span><span className="text-white font-mono">{vehicle.vin}</span></div>
                                                                    <div className="flex justify-between p-2 border-b border-white/5"><span className="text-gray-400">Year</span><span className="text-white">{vehicle.year}</span></div>
                                                                    <div className="flex justify-between p-2"><span className="text-gray-400">Vendor</span><span className="text-white">{vehicle.vendor || 'N/A'}</span></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {sortedVehicles.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-gray-400">
                                            No vehicles found. Add your first vehicle to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Add New Vehicle</h2>
                                <button onClick={() => { setIsModalOpen(false); reset(); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Make</label>
                                        <input type="text" value={data.make} onChange={e => setData('make', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 md:p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="Ford" required />
                                        {errors.make && <div className="text-rose-400 text-xs mt-1">{errors.make}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                                        <input type="text" value={data.model} onChange={e => setData('model', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 md:p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="Transit Connect" required />
                                        {errors.model && <div className="text-rose-400 text-xs mt-1">{errors.model}</div>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                                    <input type="number" value={data.year} onChange={e => setData('year', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="2024" required />
                                    {errors.year && <div className="text-rose-400 text-xs mt-1">{errors.year}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Vendor / Assignee (Optional)</label>
                                    <input type="text" value={data.vendor} onChange={e => setData('vendor', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="e.g. Acme Corp" />
                                    {errors.vendor && <div className="text-rose-400 text-xs mt-1">{errors.vendor}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">VIN</label>
                                    <input type="text" value={data.vin} onChange={e => setData('vin', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none uppercase font-mono" placeholder="1FTBR1ZC..." required />
                                    {errors.vin && <div className="text-rose-400 text-xs mt-1">{errors.vin}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">License Plate</label>
                                    <input type="text" value={data.license_plate} onChange={e => setData('license_plate', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none uppercase" placeholder="ABC-1234" required />
                                    {errors.license_plate && <div className="text-rose-400 text-xs mt-1">{errors.license_plate}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Initial Odometer (miles)</label>
                                    <input type="number" value={data.odometer} onChange={e => setData('odometer', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="15000" required />
                                    {errors.odometer && <div className="text-rose-400 text-xs mt-1">{errors.odometer}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Assign Driver (Optional)</label>
                                    <select value={data.driver_id} onChange={e => setData('driver_id', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none">
                                        <option value="">No driver assigned</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>{d.user.name}</option>
                                        ))}
                                    </select>
                                    {errors.driver_id && <div className="text-rose-400 text-xs mt-1">{errors.driver_id}</div>}
                                </div>

                                {/* Google Maps Location Picker */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-electric-blue" /> Vehicle Location (Optional)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">Search for an address using Google Maps, then fine-tune by clicking the map.</p>

                                    {GOOGLE_MAPS_API_KEY ? (
                                        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                                            <div className="space-y-2">
                                                {/* Google Places Autocomplete Search */}
                                                <div className="flex gap-2">
                                                    <div className="flex-1 relative">
                                                        <PlacesAutocomplete
                                                            onPlaceSelected={handlePlaceSelected}
                                                            searchQuery={searchQuery}
                                                            setSearchQuery={setSearchQuery}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (searchQuery.trim()) geocodeWithNominatim(searchQuery);
                                                        }}
                                                        disabled={isGeocoding}
                                                        className="bg-electric-blue hover:bg-sky-400 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {isGeocoding ? <Loader className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                                        Search
                                                    </button>
                                                </div>

                                                {/* Manual Lat/Lng Input */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={data.latitude}
                                                            onChange={(e) => {
                                                                setData('latitude', e.target.value);
                                                                if (e.target.value && data.longitude) {
                                                                    setMapLocation({
                                                                        latitude: parseFloat(e.target.value),
                                                                        longitude: parseFloat(data.longitude),
                                                                    });
                                                                }
                                                            }}
                                                            placeholder="Latitude (e.g. 6.5244)"
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none placeholder-gray-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={data.longitude}
                                                            onChange={(e) => {
                                                                setData('longitude', e.target.value);
                                                                if (e.target.value && data.latitude) {
                                                                    setMapLocation({
                                                                        latitude: parseFloat(data.latitude),
                                                                        longitude: parseFloat(e.target.value),
                                                                    });
                                                                }
                                                            }}
                                                            placeholder="Longitude (e.g. 3.3792)"
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none placeholder-gray-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Google Map */}
                                                <div className={`rounded-lg overflow-hidden border border-white/10 relative transition-all ${showMapPicker ? 'h-48 md:h-56' : 'h-0 border-0'}`}>
                                                    {showMapPicker && (
                                                        <GoogleMap
                                                            mapId="DEMO_MAP_ID"
                                                            defaultCenter={{ lat: mapLocation.latitude, lng: mapLocation.longitude }}
                                                            defaultZoom={16}
                                                            onClick={(e) => {
                                                                if (e.detail && e.detail.latLng) {
                                                                    const lat = e.detail.latLng.lat;
                                                                    const lng = e.detail.latLng.lng;
                                                                    setMapLocation({ latitude: lat, longitude: lng });
                                                                    setData('latitude', lat.toString());
                                                                    setData('longitude', lng.toString());
                                                                }
                                                            }}
                                                            disableDefaultUI={true}
                                                            style={{ width: '100%', height: '100%' }}
                                                        >
                                                            {data.latitude && data.longitude && (
                                                                <AdvancedMarker
                                                                    position={{ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) }}
                                                                >
                                                                    <div className="bg-electric-blue w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-electric-blue/50 border-2 border-white">
                                                                        <MapPin className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </AdvancedMarker>
                                                            )}
                                                        </GoogleMap>
                                                    )}
                                                </div>

                                                {/* Map toggle + coords display */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {data.latitude && data.longitude ? (
                                                            <span className="text-xs text-emerald-400">
                                                                ✓ {parseFloat(data.latitude).toFixed(6)}, {parseFloat(data.longitude).toFixed(6)}
                                                                {searchResultAddress && <span className="text-gray-400 ml-1">• {searchResultAddress.substring(0, 30)}...</span>}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-500">No location set</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {!showMapPicker ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMapLocation({
                                                                        latitude: parseFloat(data.latitude) || 6.5244,
                                                                        longitude: parseFloat(data.longitude) || 3.3792,
                                                                    });
                                                                    setShowMapPicker(true);
                                                                }}
                                                                className="text-xs text-electric-blue hover:text-sky-300 transition-colors"
                                                            >
                                                                Show Map
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowMapPicker(false)}
                                                                className="text-xs text-gray-400 hover:text-white transition-colors"
                                                            >
                                                                Hide Map
                                                            </button>
                                                        )}
                                                        {data.latitude && data.longitude && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('latitude', '');
                                                                    setData('longitude', '');
                                                                    setSearchQuery('');
                                                                    setSearchResultAddress('');
                                                                }}
                                                                className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </APIProvider>
                                    ) : (
                                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                            <p className="text-xs text-amber-300">
                                                Google Maps API key not found. Set <code className="text-white font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your .env file to enable address search.
                                                You can still type coordinates manually below.
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <input type="number" step="any" value={data.latitude} onChange={e => setData('latitude', e.target.value)} placeholder="Latitude" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm outline-none placeholder-gray-500" />
                                                <input type="number" step="any" value={data.longitude} onChange={e => setData('longitude', e.target.value)} placeholder="Longitude" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm outline-none placeholder-gray-500" />
                                            </div>
                                        </div>
                                    )}
                                    {errors.latitude && <div className="text-rose-400 text-xs mt-1">{errors.latitude}</div>}
                                    {errors.longitude && <div className="text-rose-400 text-xs mt-1">{errors.longitude}</div>}
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setIsModalOpen(false); reset(); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-electric-blue/20 disabled:opacity-50">
                                        {processing ? 'Saving...' : 'Save Vehicle'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDispatchModalOpen && selectedVehicle && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Start New Trip</h2>
                                <button onClick={() => { setIsDispatchModalOpen(false); dispatchForm.reset(); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitDispatch} className="p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-gray-300 text-sm mb-4">
                                        Assigning driver to: <strong className="text-white">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.license_plate})</strong>
                                    </p>

                                    <label className="block text-sm font-medium text-gray-300 mb-1">Select Driver</label>
                                    <select
                                        value={dispatchForm.data.driver_id}
                                        onChange={e => dispatchForm.setData('driver_id', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        required
                                    >
                                        <option value="">-- Choose a Driver --</option>
                                        {drivers.map(driver => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.user?.name} ({driver.license_no})
                                            </option>
                                        ))}
                                    </select>
                                    {dispatchForm.errors.driver_id && <div className="text-rose-400 text-xs mt-1">{dispatchForm.errors.driver_id}</div>}
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setIsDispatchModalOpen(false); dispatchForm.reset(); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={dispatchForm.processing} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                                        {dispatchForm.processing ? 'Starting...' : 'Start Trip'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <BulkImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Vehicles"
                importRoute="dashboard.vehicles.import"
                templateHeaders={['make', 'model', 'year', 'vin', 'license_plate', 'vendor', 'odometer']}
                templateFilename="FKG.Fleet_vehicles_template.csv"
            />
        </DashboardLayout>
    );
}