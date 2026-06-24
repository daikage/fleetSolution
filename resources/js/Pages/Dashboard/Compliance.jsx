import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Plus, X, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';

export default function Compliance({ documents, vehicles, drivers }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        documentable_type: 'vehicle',
        documentable_id: '',
        document_type: '',
        expiry_date: '',
        url: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dashboard.compliance.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const exportColumns = [
        { header: 'Entity', key: 'entity_name' },
        { header: 'Type', key: 'entity_type' },
        { header: 'Document Type', key: 'document_type' },
        { header: 'Expiry Date', key: 'expiry_date' },
        { header: 'Status', key: 'status' }
    ];

    const exportData = documents.map(doc => {
        const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
        return {
            entity_name: doc.entity_name,
            entity_type: doc.documentable_type.includes('Vehicle') ? 'Vehicle' : 'Driver',
            document_type: doc.document_type,
            expiry_date: doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A',
            status: isExpired ? 'Expired' : 'Valid'
        };
    });

    return (
        <DashboardLayout>
            <Head title="Compliance & Documents - FleetOS" />
            
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Compliance Management</h1>
                        <p className="text-gray-400 mt-1">Track document expirations for drivers and vehicles</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <ExportButtons data={exportData} columns={exportColumns} filename="Compliance_Documents" title="Compliance Documents" />
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Document
                        </button>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Entity</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Document Type</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Expiry Date</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => {
                                    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                                    return (
                                        <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{doc.entity_name}</div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wider">{doc.documentable_type.includes('Vehicle') ? 'Vehicle' : 'Driver'}</div>
                                            </td>
                                            <td className="p-4 text-gray-300 capitalize flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                {doc.document_type}
                                            </td>
                                            <td className="p-4 text-gray-300 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                {isExpired ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Expired
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Valid
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {documents.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-gray-400">
                                            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            No compliance documents uploaded yet.
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
                                <h2 className="text-xl font-bold text-white">Add Document</h2>
                                <button onClick={() => { setIsModalOpen(false); reset(); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Entity Type</label>
                                        <select 
                                            value={data.documentable_type} 
                                            onChange={e => setData('documentable_type', e.target.value)} 
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none" 
                                            required
                                        >
                                            <option value="vehicle">Vehicle</option>
                                            <option value="driver">Driver</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Select {data.documentable_type === 'vehicle' ? 'Vehicle' : 'Driver'}</label>
                                        <select 
                                            value={data.documentable_id} 
                                            onChange={e => setData('documentable_id', e.target.value)} 
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none" 
                                            required
                                        >
                                            <option value="">-- Choose --</option>
                                            {data.documentable_type === 'vehicle' 
                                                ? vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)
                                                : drivers.map(d => <option key={d.id} value={d.id}>{d.user?.name}</option>)
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Document Type</label>
                                    <input 
                                        type="text" 
                                        value={data.document_type} 
                                        onChange={e => setData('document_type', e.target.value)} 
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none" 
                                        placeholder="e.g. Driver's License, Insurance" 
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
                                    <input 
                                        type="date" 
                                        value={data.expiry_date} 
                                        onChange={e => setData('expiry_date', e.target.value)} 
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none [color-scheme:dark]" 
                                    />
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setIsModalOpen(false); reset(); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                        {processing ? 'Saving...' : 'Add Document'}
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
