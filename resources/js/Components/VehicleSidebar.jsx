import { motion, AnimatePresence } from 'framer-motion';
import { X, Battery, Activity, AlertCircle, User as UserIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function VehicleSidebar({ vehicle, onClose }) {
    return (
        <AnimatePresence>
            {vehicle && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-4 right-4 bottom-4 w-80 md:w-96 glass-panel z-40 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div>
                            <h2 className="text-xl font-bold text-white">{vehicle.make} {vehicle.model}</h2>
                            <p className="text-gray-400 text-sm mt-1">{vehicle.license_plate}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                            <span className="text-emerald-400 font-medium tracking-wide uppercase text-sm">Active & Online</span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Activity className="w-4 h-4 text-electric-blue" />
                                    <span className="text-xs font-semibold uppercase">Speed</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{vehicle.speed} <span className="text-sm text-gray-500 font-normal">mph</span></div>
                            </div>
                            
                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <AlertCircle className="w-4 h-4 text-rose-400" />
                                    <span className="text-xs font-semibold uppercase">Alerts</span>
                                </div>
                                <div className="text-2xl font-bold text-white">0 <span className="text-sm text-gray-500 font-normal">critical</span></div>
                            </div>
                        </div>

                        {/* Driver Info */}
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Driver</h3>
                            
                            {vehicle.active_driver ? (
                                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5 relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-electric-blue to-purple-500 flex items-center justify-center text-lg font-bold">
                                        {vehicle.active_driver.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{vehicle.active_driver}</div>
                                        <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                            Active Trip
                                        </div>
                                    </div>
                                    {vehicle.trips && vehicle.trips[0] && (
                                        <Link
                                            href={route('dashboard.trips.end', vehicle.trips[0].id)}
                                            method="put"
                                            as="button"
                                            onClick={onClose}
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-rose-500/20 border border-rose-500/30 rounded-lg hover:bg-rose-500/40 transition-colors absolute right-4 top-1/2 -translate-y-1/2"
                                            title="End Trip"
                                        >
                                            End Trip
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5 border-dashed">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Unassigned / Idle</div>
                                        <div className="text-xs text-gray-500 mt-1">No active trip found</div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
