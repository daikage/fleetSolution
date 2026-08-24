import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Route, Clock, MapPin, Car, User, Search, X, Navigation, TrendingUp } from 'lucide-react';

export default function Trips({ trips, drivers, vehicles, filters }) {
    const [driverFilter, setDriverFilter] = useState(filters?.driver_id || '');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');

    const handleFilter = () => {
        router.get(route('dashboard.trips'), {
            driver_id: driverFilter,
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setDriverFilter('');
        setStartDate('');
        setEndDate('');
        router.get(route('dashboard.trips'), {}, {
            preserveState: true,
        });
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '-';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const getStatusBadge = (trip) => {
        if (trip.status === 'active') {
            return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>;
        }
        if (trip.status === 'completed') {
            return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Completed</span>;
        }
        return null;
    };

    return (
        <DashboardLayout>
            <Head title="Trip History - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Route className="w-8 h-8 text-electric-blue" />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Trip History</h1>
                            <p className="text-gray-400 mt-1 text-sm md:text-base">Monitor driver trips, duration, distance and track driver activity</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-panel p-4 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Driver</label>
                            <select
                                value={driverFilter}
                                onChange={(e) => setDriverFilter(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none text-sm"
                            >
                                <option value="">All Drivers</option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.user?.name || `Driver #${driver.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none text-sm"
                            />
                        </div>

                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-300 mb-1">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none text-sm"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleFilter}
                                className="bg-electric-blue hover:bg-sky-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2 text-sm"
                            >
                                <Search className="w-4 h-4" />
                                Filter
                            </button>
                            {(driverFilter || startDate || endDate) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors border border-white/10 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {trips.data && trips.data.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="glass-panel p-4">
                            <div className="flex items-center gap-3">
                                <Navigation className="w-5 h-5 text-electric-blue" />
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total Trips</p>
                                    <p className="text-xl font-bold text-white">{trips.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel p-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-400" />
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Avg Duration</p>
                                    <p className="text-xl font-bold text-white">
                                        {trips.data.length > 0
                                            ? formatDuration(
                                                trips.data.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) /
                                                trips.data.filter(t => t.duration_minutes).length
                                            )
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel p-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Avg Distance</p>
                                    <p className="text-xl font-bold text-white">
                                        {trips.data.length > 0
                                            ? (
                                                trips.data.reduce((sum, t) => sum + (parseFloat(t.distance_km) || 0), 0) /
                                                trips.data.filter(t => t.distance_km).length
                                            ).toFixed(1) + ' km'
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trips Table */}
                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-3 text-sm font-semibold text-gray-300">Driver</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Vehicle</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Start</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">End</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Duration</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Distance</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Start Odo</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">End Odo</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trips.data && trips.data.length > 0 ? (
                                    trips.data.map((trip) => (
                                        <tr key={trip.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="text-white text-sm">{trip.driver?.user?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Car className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-300 text-sm">{trip.vehicle?.license_plate || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-gray-300 text-sm">
                                                {trip.start_time ? (
                                                    <div>
                                                        <div>{new Date(trip.start_time).toLocaleDateString()}</div>
                                                        <div className="text-xs text-gray-500">{new Date(trip.start_time).toLocaleTimeString()}</div>
                                                        {trip.start_location && (
                                                            <div className="text-xs text-sky-400 mt-1 flex items-center gap-1 truncate max-w-[150px]" title={trip.start_location}>
                                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                <span className="truncate">{trip.start_location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="p-3 text-gray-300 text-sm">
                                                {trip.end_time ? (
                                                    <div>
                                                        <div>{new Date(trip.end_time).toLocaleDateString()}</div>
                                                        <div className="text-xs text-gray-500">{new Date(trip.end_time).toLocaleTimeString()}</div>
                                                        {trip.end_location && (
                                                            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 truncate max-w-[150px]" title={trip.end_location}>
                                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                <span className="truncate">{trip.end_location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-emerald-400 text-xs font-medium flex items-center gap-1"><MapPin className="w-3 h-3 animate-pulse" /> In Progress</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-gray-300 text-sm">{formatDuration(trip.duration_minutes)}</td>
                                            <td className="p-3 text-gray-300 text-sm">
                                                {trip.distance_km ? `${parseFloat(trip.distance_km).toFixed(1)} km` : '-'}
                                            </td>
                                            <td className="p-3 text-gray-300 text-sm">
                                                {trip.start_odometer ? `${parseFloat(trip.start_odometer).toLocaleString()} km` : '-'}
                                            </td>
                                            <td className="p-3 text-gray-300 text-sm">
                                                {trip.end_odometer ? `${parseFloat(trip.end_odometer).toLocaleString()} km` : '-'}
                                            </td>
                                            <td className="p-3">{getStatusBadge(trip)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="p-8 text-center text-gray-500">
                                            <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p className="text-lg font-medium">No trips found</p>
                                            <p className="text-sm mt-1">Trips will appear here once drivers start using the system</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {trips.links && trips.links.length > 3 && (
                        <div className="p-4 border-t border-white/10">
                            <div className="flex justify-center gap-2">
                                {trips.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${link.active
                                                ? 'bg-electric-blue text-white'
                                                : link.url
                                                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                                    : 'text-gray-600 cursor-default'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}