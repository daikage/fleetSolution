import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import BulkImportModal from '@/Components/BulkImportModal';
import { Plus, Settings, Trash2, X, Navigation, FileText, File as FileIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';

export default function Vehicles({ vehicles, drivers }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [expandedVehicleId, setExpandedVehicleId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        make: '',
        model: '',
        year: '',
        vin: '',
        license_plate: '',
        odometer: '',
        vendor: '',
        driver_id: '',
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

    // Group vehicles by vendor for optional display logic, but a sorted list is better.
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
                                                        {!vehicle.trips || vehicle.trips.length === 0 ? (
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
                                                            <div className="flex gap-2">
                                                                <Link
                                                                    href={route('dashboard.trips.end', vehicle.trips[0].id)}
                                                                    method="put"
                                                                    as="button"
                                                                    className="px-3 py-1 text-xs font-bold text-white bg-amber-500/20 border border-amber-500/30 rounded-lg hover:bg-amber-500/40 transition-colors"
                                                                    title="End Trip"
                                                                >
                                                                    End Trip
                                                                </Link>
                                                                <Link
                                                                    href={route('dashboard.trips.destroy', vehicle.trips[0].id)}
                                                                    method="delete"
                                                                    as="button"
                                                                    className="px-3 py-1 text-xs font-bold text-white bg-rose-500/20 border border-rose-500/30 rounded-lg hover:bg-rose-500/40 transition-colors"
                                                                    title="Cancel Trip"
                                                                >
                                                                    Cancel Trip
                                                                </Link>
                                                            </div>
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

                                <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                                    <p className="text-sm text-sky-200">
                                        <strong>Location Tracking:</strong> The vehicle's initial location will be automatically determined once the assigned driver logs into the Mobile App or when the installed GPS tracker sends its first ping.
                                    </p>
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
