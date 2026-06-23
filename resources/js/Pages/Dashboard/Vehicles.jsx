import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Plus, Settings, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Vehicles({ vehicles }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        make: '',
        model: '',
        year: '',
        vin: '',
        license_plate: '',
        odometer: '',
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

    return (
        <DashboardLayout>
            <Head title="Vehicles - FleetOS" />
            
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Vehicles</h1>
                        <p className="text-gray-400 mt-1">Manage your fleet registry</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Vehicle
                    </button>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Vehicle</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">VIN</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">License Plate</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Odometer</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white">{vehicle.make} {vehicle.model}</div>
                                            <div className="text-sm text-gray-400">{vehicle.year}</div>
                                        </td>
                                        <td className="p-4 text-gray-300 font-mono text-sm">{vehicle.vin}</td>
                                        <td className="p-4 text-gray-300">{vehicle.license_plate}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                                                vehicle.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                vehicle.status === 'in_shop' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            }`}>
                                                {vehicle.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-300">{vehicle.odometer.toLocaleString()} mi</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                                    <Settings className="w-4 h-4" />
                                                </button>
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
                                ))}
                                {vehicles.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Make</label>
                                        <input type="text" value={data.make} onChange={e => setData('make', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="Ford" required />
                                        {errors.make && <div className="text-rose-400 text-xs mt-1">{errors.make}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                                        <input type="text" value={data.model} onChange={e => setData('model', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="Transit Connect" required />
                                        {errors.model && <div className="text-rose-400 text-xs mt-1">{errors.model}</div>}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                                    <input type="number" value={data.year} onChange={e => setData('year', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="2024" required />
                                    {errors.year && <div className="text-rose-400 text-xs mt-1">{errors.year}</div>}
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
        </DashboardLayout>
    );
}
