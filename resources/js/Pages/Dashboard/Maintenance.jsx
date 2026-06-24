import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import BulkImportModal from '@/Components/BulkImportModal';
import { Plus, X, Wrench, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';

export default function Maintenance({ maintenances, vehicles }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        vehicle_id: '',
        service_type: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dashboard.maintenance.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const exportColumns = [
        { header: 'Date', key: 'date' },
        { header: 'Vehicle', key: 'vehicle_name' },
        { header: 'License Plate', key: 'license_plate' },
        { header: 'Service Type', key: 'service_type' },
        { header: 'Cost (₦)', key: 'cost' }
    ];

    const exportData = maintenances.map(log => ({
        date: new Date(log.date).toLocaleDateString(),
        vehicle_name: `${log.vehicle?.make || ''} ${log.vehicle?.model || ''}`.trim() || 'Unknown',
        license_plate: log.vehicle?.license_plate || 'N/A',
        service_type: log.service_type,
        cost: log.cost
    }));

    return (
        <DashboardLayout>
            <Head title="Maintenance - FleetOS" />
            
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Maintenance Logs</h1>
                        <p className="text-gray-400 mt-1">Track vehicle repairs and financial costs</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ExportButtons data={exportData} columns={exportColumns} filename="Maintenance_Logs" title="Maintenance Logs" />
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-full font-medium transition-colors border border-white/10 flex items-center gap-2"
                        >
                            <FileText className="w-5 h-5 text-emerald-400" />
                            <span className="hidden sm:inline">Import Bulk</span>
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Log Service
                        </button>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Date</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Vehicle</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Service Type</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenances.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-gray-300 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            {new Date(log.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-white">{log.vehicle?.make} {log.vehicle?.model}</div>
                                            <div className="text-sm text-gray-400">{log.vehicle?.license_plate}</div>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Wrench className="w-4 h-4 text-amber-400" />
                                                {log.service_type}
                                            </div>
                                        </td>
                                        <td className="p-4 text-emerald-400 font-mono flex items-center gap-1">
                                            <span className="font-semibold text-sm">₦</span>
                                            {Number(log.cost).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {maintenances.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-gray-400">
                                            <Wrench className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            No maintenance records found. Keep your fleet healthy by logging repairs.
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
                            className="glass-panel w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Log Service Event</h2>
                                <button onClick={() => { setIsModalOpen(false); reset(); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Select Vehicle</label>
                                    <select 
                                        value={data.vehicle_id} 
                                        onChange={e => setData('vehicle_id', e.target.value)} 
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" 
                                        required
                                    >
                                        <option value="">-- Choose a Vehicle --</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.make} {v.model} ({v.license_plate})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.vehicle_id && <div className="text-rose-400 text-xs mt-1">{errors.vehicle_id}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Service Type</label>
                                    <input 
                                        type="text" 
                                        value={data.service_type} 
                                        onChange={e => setData('service_type', e.target.value)} 
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" 
                                        placeholder="e.g. Oil Change, Tire Rotation" 
                                        required 
                                    />
                                    {errors.service_type && <div className="text-rose-400 text-xs mt-1">{errors.service_type}</div>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Cost (₦)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={data.cost} 
                                            onChange={e => setData('cost', e.target.value)} 
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" 
                                            placeholder="150.00" 
                                            required 
                                        />
                                        {errors.cost && <div className="text-rose-400 text-xs mt-1">{errors.cost}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                                        <input 
                                            type="date" 
                                            value={data.date} 
                                            onChange={e => setData('date', e.target.value)} 
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none [color-scheme:dark]" 
                                            required 
                                        />
                                        {errors.date && <div className="text-rose-400 text-xs mt-1">{errors.date}</div>}
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setIsModalOpen(false); reset(); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-electric-blue/20 disabled:opacity-50">
                                        {processing ? 'Logging...' : 'Log Service'}
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
                title="Import Maintenance Logs"
                importRoute="dashboard.maintenance.import"
                templateHeaders={['license_plate', 'service_type', 'cost', 'date']}
                templateFilename="fleetos_maintenance_template.csv"
            />
        </DashboardLayout>
    );
}
