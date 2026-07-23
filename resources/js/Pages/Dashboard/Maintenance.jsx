import React, { useState, Fragment } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import BulkImportModal from '@/Components/BulkImportModal';
import { Plus, X, Wrench, Calendar, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';

export default function Maintenance({ maintenances, vehicles }) {
    const { auth } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // Action modal state
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState(null);
    const [actionType, setActionType] = useState(''); // 'Accepted' or 'Rejected'
    const [expandedRow, setExpandedRow] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        vehicle_id: '',
        type: 'Regular Servicing',
        service_type: '',
        diagnosis: '',
        work_to_be_done: '',
        vehicle_location: '',
        handled_by: '',
        supervised_by: '',
        company: '',
        vehicle_user: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
    });

    const actionForm = useForm({
        status: '',
        reviewer_comment: '',
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

    const submitAction = (e) => {
        e.preventDefault();
        actionForm.post(route('dashboard.maintenance.action', selectedMaintenance.id), {
            onSuccess: () => {
                setActionModalOpen(false);
                actionForm.reset();
                setSelectedMaintenance(null);
            },
        });
    };

    const openActionModal = (maintenance, type) => {
        setSelectedMaintenance(maintenance);
        setActionType(type);
        actionForm.setData({
            status: type,
            reviewer_comment: '',
        });
        setActionModalOpen(true);
    };

    const exportColumns = [
        { header: 'VEHICLE MAKE', key: 'vehicle_name' },
        { header: 'PLATE NUMBER', key: 'license_plate' },
        { header: 'DIAGNOSIS', key: 'diagnosis' },
        { header: 'WORK TO BE DONE', key: 'work_to_be_done' },
        { header: 'VEHICLE LOCATION', key: 'vehicle_location' },
        { header: 'Handled By', key: 'handled_by' },
        { header: 'Supervised By', key: 'supervised_by' },
        { header: 'Company', key: 'company' },
        { header: 'VEHICLE USER', key: 'vehicle_user' },
        { header: 'AMOUNT (N)', key: 'cost' },
        { header: 'Date', key: 'date' },
        { header: 'Status', key: 'status' }
    ];

    const exportData = maintenances.map(log => ({
        vehicle_name: `${log.vehicle?.make || ''} ${log.vehicle?.model || ''}`.trim() || 'Unknown',
        license_plate: log.vehicle?.license_plate || 'N/A',
        diagnosis: log.diagnosis || '',
        work_to_be_done: log.work_to_be_done || '',
        vehicle_location: log.vehicle_location || '',
        handled_by: log.handled_by || '',
        supervised_by: log.supervised_by || '',
        company: log.company || '',
        vehicle_user: log.vehicle_user || '',
        cost: log.cost,
        date: new Date(log.date).toLocaleDateString(),
        status: log.status
    }));

    return (
        <DashboardLayout>
            <Head title="Maintenance - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Maintenance Logs</h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Track vehicle repairs and financial costs</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <ExportButtons data={exportData} columns={exportColumns} filename="Maintenance_Logs" title="Maintenance Logs" />
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
                                    <th className="p-4 text-sm font-semibold text-gray-300">Type / Service</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Diagnosis / Work</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Location / User</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Mechanic / Company</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Cost</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenances.map((log) => (
                                    <Fragment key={log.id}>
                                        <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${expandedRow === log.id ? 'bg-white/5' : ''}`} onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}>
                                            <td className="p-4 text-gray-300 text-sm flex items-center gap-2">
                                                <button className="text-gray-400 hover:text-white transition-colors mr-1 shrink-0 focus:outline-none">
                                                    {expandedRow === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                                {new Date(log.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-white">{log.vehicle?.make} {log.vehicle?.model}</div>
                                                <div className="text-sm text-gray-400">{log.vehicle?.license_plate}</div>
                                            </td>
                                            <td className="p-4 text-gray-300 text-sm">
                                                <div className="mb-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${log.type === 'Repair' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {log.type}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 text-gray-400">
                                                    <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                                                    <span className="truncate max-w-[120px] inline-block">{log.service_type}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300 text-sm max-w-[200px]">
                                                {log.diagnosis && <div className="truncate mb-1"><span className="text-gray-500 text-xs uppercase tracking-wider">Diag:</span> {log.diagnosis}</div>}
                                                {log.work_to_be_done && <div className="truncate"><span className="text-gray-500 text-xs uppercase tracking-wider">Work:</span> {log.work_to_be_done}</div>}
                                                {!log.diagnosis && !log.work_to_be_done && <span className="text-gray-600 italic">No details</span>}
                                            </td>
                                            <td className="p-4 text-gray-300 text-sm max-w-[150px]">
                                                {log.vehicle_location && <div className="truncate mb-1"><span className="text-gray-500 text-xs uppercase tracking-wider">Loc:</span> {log.vehicle_location}</div>}
                                                {log.vehicle_user && <div className="truncate"><span className="text-gray-500 text-xs uppercase tracking-wider">User:</span> {log.vehicle_user}</div>}
                                                {!log.vehicle_location && !log.vehicle_user && <span className="text-gray-600">-</span>}
                                            </td>
                                            <td className="p-4 text-gray-300 text-sm max-w-[150px]">
                                                {log.company && <div className="font-medium text-white truncate mb-1">{log.company}</div>}
                                                {log.handled_by && <div className="truncate"><span className="text-gray-500 text-xs uppercase tracking-wider">By:</span> {log.handled_by}</div>}
                                                {log.supervised_by && <div className="truncate"><span className="text-gray-500 text-xs uppercase tracking-wider">Sup:</span> {log.supervised_by}</div>}
                                                {!log.company && !log.handled_by && !log.supervised_by && <span className="text-gray-600">-</span>}
                                            </td>
                                            <td className="p-4 text-emerald-400 font-mono flex items-center gap-1">
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
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                                        {expandedRow === log.id && (
                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                <td colSpan="9" className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Diagnosis Details</h4>
                                                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{log.diagnosis || <span className="italic text-gray-600">No diagnosis recorded</span>}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Work To Be Done</h4>
                                                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{log.work_to_be_done || <span className="italic text-gray-600">No work details recorded</span>}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location & User</h4>
                                                                <div className="text-gray-300 text-sm">
                                                                    <div className="mb-1"><span className="text-gray-500">Location:</span> {log.vehicle_location || '-'}</div>
                                                                    <div><span className="text-gray-500">Vehicle User:</span> {log.vehicle_user || '-'}</div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cost Breakdown</h4>
                                                                <div className="text-emerald-400 font-mono text-lg flex items-center gap-1">
                                                                    <span className="font-semibold text-sm">₦</span>
                                                                    {Number(log.cost).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Personnel Details</h4>
                                                                <div className="text-gray-300 text-sm">
                                                                    <div className="mb-1"><span className="text-gray-500">Company/Vendor:</span> {log.company || '-'}</div>
                                                                    <div className="mb-1"><span className="text-gray-500">Handled By:</span> {log.handled_by || '-'}</div>
                                                                    <div><span className="text-gray-500">Supervised By:</span> {log.supervised_by || '-'}</div>
                                                                </div>
                                                            </div>
                                                            {log.reviewer_comment && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reviewer Comment</h4>
                                                                    <p className="text-gray-300 text-sm whitespace-pre-wrap border-l-2 border-electric-blue pl-3 py-1 bg-white/5 rounded-r-md">{log.reviewer_comment}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                                {maintenances.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="p-12 text-center text-gray-400">
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
                            className="glass-panel w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Log Service Event</h2>
                                <button onClick={() => { setIsModalOpen(false); reset(); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
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
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                                    <select
                                        value={data.type}
                                        onChange={e => setData('type', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        required
                                    >
                                        <option value="Regular Servicing">Regular Servicing</option>
                                        <option value="Repair">Repair</option>
                                    </select>
                                    {errors.type && <div className="text-rose-400 text-xs mt-1">{errors.type}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Service Details</label>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Diagnosis</label>
                                        <input
                                            type="text"
                                            value={data.diagnosis}
                                            onChange={e => setData('diagnosis', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Work to be Done</label>
                                        <input
                                            type="text"
                                            value={data.work_to_be_done}
                                            onChange={e => setData('work_to_be_done', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle Location</label>
                                        <input
                                            type="text"
                                            value={data.vehicle_location}
                                            onChange={e => setData('vehicle_location', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle User</label>
                                        <input
                                            type="text"
                                            value={data.vehicle_user}
                                            onChange={e => setData('vehicle_user', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Handled By</label>
                                        <input
                                            type="text"
                                            value={data.handled_by}
                                            onChange={e => setData('handled_by', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Supervised By</label>
                                        <input
                                            type="text"
                                            value={data.supervised_by}
                                            onChange={e => setData('supervised_by', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Company / Vendor</label>
                                    <input
                                        type="text"
                                        value={data.company}
                                        onChange={e => setData('company', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        placeholder="Mechanic shop or vendor name"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        {processing ? 'Logging...' : 'Submit Request'}
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
                                    You are about to <strong>{actionType.toLowerCase()}</strong> the maintenance request for ₦{Number(selectedMaintenance?.cost).toLocaleString()} from {selectedMaintenance?.vehicle?.license_plate}.
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
                title="Import Maintenance Logs"
                importRoute="dashboard.maintenance.import"
                templateHeaders={['VEHICLE MAKE', 'PLATE NUMBER', 'DIAGNOSIS', 'WORK TO BE DONE', 'VEHICLE LOCATION', 'Handled By', 'Supervised By', 'Company', 'VEHICLE USER', 'AMOUNT (N)', 'Type', 'Service Type', 'Date']}
                templateFilename="FKG.Fleet_maintenance_template.csv"
            />
        </DashboardLayout>
    );
}
