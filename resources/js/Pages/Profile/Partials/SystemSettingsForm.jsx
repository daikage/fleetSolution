import { useForm, usePage } from '@inertiajs/react';
import { Settings, Save, Map as MapIcon, Radio } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';

export default function SystemSettingsForm({ className = '' }) {
    const { props } = usePage();
    const settings = props.settings || {};
    const [statusMessage, setStatusMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { data, setData, errors, setError, clearErrors } = useForm({
        tracker_type: settings.tracker_type || 'mobile_app',
        map_provider: settings.map_provider || 'map_libre',
    });

    const submit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setStatusMessage('');
        clearErrors();

        try {
            const response = await axios.post('/api/settings', data);
            setStatusMessage('System settings updated successfully.');
            // Let the user see the success message briefly
            setTimeout(() => setStatusMessage(''), 3000);
            
            // Note: Since this is an API call, we might want to refresh Inertia props
            // to update global settings, or just let the next page load handle it.
            // Using window.location.reload() ensures the map component gets fresh props
            // if we navigate to it, though Inertia.reload() is better.
        } catch (error) {
            if (error.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                for (const key in apiErrors) {
                    setError(key, apiErrors[key][0]);
                }
            } else {
                setStatusMessage('Failed to update settings.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <section className={className}>
            <header className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-electric-blue" />
                <div>
                    <h2 className="text-lg font-medium text-white">System Configuration</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Manage global platform settings like map providers and tracker inputs.
                    </p>
                </div>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-gray-500" /> Map Provider
                    </label>
                    <select
                        value={data.map_provider}
                        onChange={(e) => setData('map_provider', e.target.value)}
                        className="mt-1 block w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                        required
                    >
                        <option value="map_libre">MapLibre (Default / Open Source)</option>
                        <option value="google_maps">Google Maps</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">Note: Google Maps requires a valid VITE_GOOGLE_MAPS_API_KEY in the .env file.</p>
                    {errors.map_provider && <div className="text-rose-400 text-xs mt-1">{errors.map_provider}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-gray-500" /> Tracker Type
                    </label>
                    <select
                        value={data.tracker_type}
                        onChange={(e) => setData('tracker_type', e.target.value)}
                        className="mt-1 block w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                        required
                    >
                        <option value="mobile_app">FKG.Fleet Driver App</option>
                        <option value="traccar">Traccar Server</option>
                        <option value="osmand">OsmAnd Protocol</option>
                        <option value="custom_iot">Custom IoT Device</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">Determines which telemetry source the API will accept for vehicle locations.</p>
                    {errors.tracker_type && <div className="text-rose-400 text-xs mt-1">{errors.tracker_type}</div>}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="bg-electric-blue hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-electric-blue/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isProcessing ? 'Saving...' : 'Save Configuration'}
                    </button>

                    {statusMessage && (
                        <p className={`text-sm ${statusMessage.includes('successfully') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {statusMessage}
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
