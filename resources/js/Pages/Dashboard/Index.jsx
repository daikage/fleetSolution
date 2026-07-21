import { useState, useEffect } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import FleetMap from '@/Components/FleetMap';
import VehicleSidebar from '@/Components/VehicleSidebar';
import { Head, Link } from '@inertiajs/react';
import { Bell, AlertTriangle, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Index({ initialVehicles, upcomingExpiries }) {
    const [vehicles, setVehicles] = useState(initialVehicles || []);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showAlerts, setShowAlerts] = useState(true);

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

    const hasAlerts = upcomingExpiries && upcomingExpiries.length > 0;

    return (
        <DashboardLayout>
            <Head title="Fleet Command Center" />
            
            <div className="relative w-full h-full">
                <FleetMap 
                    vehicles={vehicles} 
                    onSelectVehicle={setSelectedVehicle} 
                />
                
                {/* Floating Expiry Alerts Panel */}
                <AnimatePresence>
                    {hasAlerts && showAlerts && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20, x: 20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-4 right-4 md:right-8 z-10 w-80 max-h-96 flex flex-col glass-panel shadow-2xl border border-rose-500/30 overflow-hidden"
                        >
                            <div className="bg-rose-500/20 p-3 flex justify-between items-center border-b border-rose-500/30">
                                <div className="flex items-center gap-2 text-rose-400 font-bold">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Upcoming Expiries ({upcomingExpiries.length})</span>
                                </div>
                                <button onClick={() => setShowAlerts(false)} className="text-rose-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 bg-black/40 backdrop-blur-md">
                                <ul className="space-y-2">
                                    {upcomingExpiries.map((expiry, index) => (
                                        <li key={index} className={`p-3 rounded-lg border flex flex-col gap-1 ${expiry.is_expired ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-white text-sm">{expiry.type}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${expiry.is_expired ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}`}>
                                                    {expiry.is_expired ? 'Expired' : 'Soon'}
                                                </span>
                                            </div>
                                            <span className="text-gray-300 text-xs">{expiry.entity}</span>
                                            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(expiry.expiry_date).toLocaleDateString()}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-3 text-center">
                                    <Link href={route('dashboard.compliance')} className="text-xs text-electric-blue hover:text-sky-300 transition-colors font-medium">
                                        Manage Compliance &rarr;
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Minimized Alert Bell */}
                {!showAlerts && hasAlerts && (
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setShowAlerts(true)}
                        className="absolute top-4 right-4 md:right-8 z-10 p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/20"
                    >
                        <Bell className="w-6 h-6 animate-pulse" />
                    </motion.button>
                )}
                
                <VehicleSidebar 
                    vehicle={selectedVehicle} 
                    onClose={() => setSelectedVehicle(null)} 
                />
            </div>
        </DashboardLayout>
    );
}
