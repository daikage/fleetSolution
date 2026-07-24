import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import BulkImportModal from '@/Components/BulkImportModal';
import { Plus, X, Fuel as FuelIcon, Calendar, Droplet, FileText, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';

export default function Fuel({ fuelLogs, vehicles, drivers }) {
    const { auth } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // Action modal state
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedFuelLog, setSelectedFuelLog] = useState(null);
    const [actionType, setActionType] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        vehicle_id: '',
        driver_id: '',
        date: new Date().toISOString().split('T')[0],
        liters: '',
        cost: '',
        odometer_at_fill: '',
    });

    const actionForm = useForm({
        status: '',
        reviewer_comment: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dashboard.fuel.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const submitAction = (e) => {
        e.preventDefault();
        actionForm.post(route('dashboard.fuel.action', selectedFuelLog.id), {
            onSuccess: () => {
                setActionModalOpen(false);
                actionForm.reset();
                setSelectedFuelLog(null);
            },
        });
    };

    const openActionModal = (log, type) => {
        setSelectedFuelLog(log);
        setActionType(type);
        actionForm.setData({
            status: type,
            reviewer_comment: '',
        });
        setActionModalOpen(true);
    };

    const exportColumns = [
        { header: 'Date', key: 'date' },
        { header: 'Vehicle', key: 'vehicle_name' },
        { header: 'Odometer', key: 'odometer_at_fill' },
        { header: 'Driver', key: 'driver_name' },
        { header: 'Volume (L)', key: 'liters' },
        { header: 'Cost (₦)', key: 'cost' },
        { header: 'Status', key: 'status' }
    ];

    const exportData = fuelLogs.map(log => ({
        date: new Date(log.date).toLocaleDateString(),
        vehicle_name: `${log.vehicle?.make || ''} ${log.vehicle?.model || ''}`.trim() || 'Unknown',
        odometer_at_fill: log.odometer_at_fill,
        driver_name: log.driver?.user?.name || 'N/A',
        liters: log.liters,
        cost: log.cost,
        status: log.status
    }));

    return (
        <DashboardLayout>
            <Head title="Fuel Logs - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Fuel Management</h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Track fuel consumption and detect inefficiencies</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <ExportButtons data={exportData} columns={exportColumns} filename="Fuel_Logs" title="Fuel Logs" />
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-full font-medium transition-colors border border-white/10 flex items-center gap-2 whitespace-nowrap"
                        >
                            <FileText className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                            <span className="inline">Import Bulk</span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-electric-blue hover:bg-sky-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            Submit Fuel Request
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
                                    <th className="p-4 text-sm font-semibold text-gray-300">Driver</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Volume</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Cost</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fuelLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-gray-300 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            {new Date(log.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-white">{log.vehicle?.make} {log.vehicle?.model}</div>
                                            <div className="text-sm text-gray-400">Odo: {log.odometer_at_fill} km</div>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {log.driver?.user?.name || 'N/A'}
                                        </td>
                                        <td className="p-4 text-blue-400 flex items-center gap-1">
                                            <Droplet className="w-4 h-4" />
                                            {log.liters} L
                                        </td>
                                        <td className="p-4 text-emerald-400 font-mono">
                                            <span className="font-semibold text-sm">₦</span>
                                            {Number(log.cost).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                log.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                                                log.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {log.status === 'Pending' && auth.user.role !== 'manager' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openActionModal(log, 'Accepted')} className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors" title="Accept">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => openActionModal(log, 'Rejected')} className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors" title="Reject">
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                            {log.status !== 'Pending' && (
                                                <span className="text-xs text-gray-500 italic">Actioned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {fuelLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center text-gray-400">
                                            <FuelIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            No fuel logs recorded yet.
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
                            className="glass-panel w-full max-w-lg overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Log Fuel Receipt</h2>
                                <button onClick={() => { setIsModalOpen(false); reset(); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Select Vehicle</label>
                                        <select
                                            value={data.vehicle_id}
                                            onChange={e => setData('vehicle_id', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                            required
                                        >
                                            <option value="">-- Choose --</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>{v.license_plate}</option>
                                            ))}
                                        </select>
                                        {errors.vehicle_id && <div className="text-rose-400 text-xs mt-1">{errors.vehicle_id}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Driver (Optional)</label>
                                        <select
                                            value={data.driver_id}
                                            onChange={e => setData('driver_id', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        >
                                            <option value="">-- Choose --</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id}>{d.user?.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Liters (L)</label>
                                        <input
                                            type="number" step="0.01"
                                            value={data.liters}
                                            onChange={e => setData('liters', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Cost (₦)</label>
                                        <input
                                            type="number" step="0.01"
                                            value={data.cost}
                                            onChange={e => setData('cost', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Current Odometer (km)</label>
                                        <input
                                            type="number"
                                            value={data.odometer_at_fill}
                                            onChange={e => setData('odometer_at_fill', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={data.date}
                                            onChange={e => setData('date', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none [color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setIsModalOpen(false); reset(); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                        {processing ? 'Saving...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {actionModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className={`p-6 border-b border-white/10 flex justify-between items-center ${actionType === 'Accepted' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                <h2 className="text-xl font-bold text-white">
                                    {actionType === 'Accepted' ? 'Accept' : 'Reject'} Request
                                </h2>
                                <button onClick={() => setActionModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitAction} className="p-6 flex flex-col gap-4">
                                <p className="text-gray-300 text-sm mb-2">
                                    You are about to <strong>{actionType.toLowerCase()}</strong> the fuel request for ₦{Number(selectedFuelLog?.cost).toLocaleString()} from {selectedFuelLog?.vehicle?.license_plate}.
                                </p>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Reviewer Comment</label>
                                    <textarea
                                        value={actionForm.data.reviewer_comment}
                                        onChange={e => actionForm.setData('reviewer_comment', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none min-h-[100px]"
                                        placeholder="Explain your decision..."
                                        required
                                    />
                                    {actionForm.errors.reviewer_comment && <div className="text-rose-400 text-xs mt-1">{actionForm.errors.reviewer_comment}</div>}
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setActionModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={actionForm.processing} className={`${actionType === 'Accepted' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'} text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50`}>
                                        {actionForm.processing ? 'Saving...' : 'Confirm Action'}
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
                title="Import Fuel Logs"
                importRoute="dashboard.fuel.import"
                templateHeaders={['license_plate', 'driver_email', 'liters', 'cost', 'odometer_at_fill', 'date']}
                templateFilename="FKG.Fleet_fuel_template.csv"
            />
        </DashboardLayout>
    );
}
