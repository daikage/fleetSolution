import { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import BulkImportModal from '@/Components/BulkImportModal';
import { Plus, X, FileText, Calendar, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';

export default function Compliance({ documents, vehicles, drivers, missingDocuments = [] }) {
    const { props } = usePage();
    const userRole = props.auth?.user?.role || '';
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        documentable_type: 'vehicle',
        documentable_id: '',
        document_type: '',
        reference_number: '',
        issuing_authority: '',
        expiry_date: '',
        url: '',
        document_file: null,
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
        { header: 'Ref Number', key: 'reference_number' },
        { header: 'Issuer', key: 'issuing_authority' },
        { header: 'Expiry Date', key: 'expiry_date' },
        { header: 'Status', key: 'status' }
    ];

    const exportData = documents.map(doc => {
        const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
        return {
            entity_name: doc.entity_name,
            entity_type: doc.documentable_type.includes('Vehicle') ? 'Vehicle' : 'Driver',
            document_type: doc.document_type,
            reference_number: doc.reference_number || 'N/A',
            issuing_authority: doc.issuing_authority || 'N/A',
            expiry_date: doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A',
            status: doc.status === 'Verified' ? (isExpired ? 'Expired' : 'Valid') : doc.status
        };
    });

    const handleAction = (documentId, action) => {
        router.post(route('dashboard.compliance.action', documentId), { action }, {
            preserveScroll: true
        });
    };

    const openRenewModal = (doc) => {
        setData({
            documentable_type: doc.documentable_type.includes('Vehicle') ? 'vehicle' : 'driver',
            documentable_id: doc.documentable_id,
            document_type: doc.document_type,
            reference_number: '',
            issuing_authority: '',
            expiry_date: '',
            url: '',
            document_file: null,
        });
        setIsModalOpen(true);
    };

    return (
        <DashboardLayout>
            <Head title="Compliance & Documents - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Compliance Management</h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Track document expirations for drivers and vehicles</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <ExportButtons data={exportData} columns={exportColumns} filename="Compliance_Documents" title="Compliance Documents" />
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
                            Add Document
                        </button>
                    </div>
                </div>

                {missingDocuments.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 md:p-6 shadow-lg shadow-rose-500/5">
                            <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5" /> Missing Mandatory Documents
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {missingDocuments.map((missing, idx) => (
                                    <div key={idx} className="bg-black/20 rounded-lg p-3 border border-rose-500/10">
                                        <div className="font-semibold text-white mb-1">{missing.entity_name} <span className="text-xs text-gray-500 font-normal">({missing.entity_type})</span></div>
                                        <div className="text-sm text-gray-400">Missing: <span className="text-rose-300 font-medium">{missing.missing.join(', ')}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Entity</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Document Type</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Details</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Expiry Date</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Actions</th>
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
                                                {doc.url ? (
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-electric-blue hover:underline">
                                                        {doc.document_type}
                                                    </a>
                                                ) : (
                                                    doc.document_type
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {doc.reference_number && <div className="text-sm text-gray-300">Ref: {doc.reference_number}</div>}
                                                {doc.issuing_authority && <div className="text-xs text-gray-500">Issuer: {doc.issuing_authority}</div>}
                                                {!doc.reference_number && !doc.issuing_authority && <span className="text-gray-600">-</span>}
                                            </td>
                                            <td className="p-4 text-gray-300 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                {doc.status === 'Pending Verification' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        Pending
                                                    </span>
                                                ) : doc.status === 'Rejected' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                        <XCircle className="w-3.5 h-3.5" /> Rejected
                                                    </span>
                                                ) : isExpired ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Expired
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Valid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    {doc.status === 'Pending Verification' && ['admin', 'superadmin', 'super_admin', 'manager'].includes(userRole) && (
                                                        <>
                                                            <button onClick={() => handleAction(doc.id, 'verify')} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Verify">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleAction(doc.id, 'reject')} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors" title="Reject">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => openRenewModal(doc)} className="p-1.5 rounded-lg bg-electric-blue/10 text-electric-blue hover:bg-electric-blue/20 transition-colors" title="Renew Document">
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                </div>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                ? vehicles.map(v => <option key={v.id} value={v.id}>{v.name} - {v.license_plate}</option>)
                                                : drivers.map(d => <option key={d.id} value={d.id}>{d.user?.name}</option>)
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Document Type</label>
                                    <select
                                        value={data.document_type}
                                        onChange={e => setData('document_type', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        required
                                    >
                                        <option value="">-- Select Document Type --</option>
                                        {data.documentable_type === 'vehicle' ? (
                                            <>
                                                <option value="Vehicle License">Vehicle License</option>
                                                <option value="Roadworthiness">Roadworthiness</option>
                                                <option value="Insurance">Insurance</option>
                                                <option value="Stage Carriage">Stage Carriage</option>
                                                <option value="MOT">MOT</option>
                                                <option value="Hackney">Hackney</option>
                                                <option value="LG Papers">LG Papers</option>
                                                <option value="Battery">Battery</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Driver License">Driver License</option>
                                                <option value="Medical Certificate">Medical Certificate</option>
                                                <option value="Background Check">Background Check</option>
                                                <option value="LASDRI">LASDRI</option>
                                                <option value="Driver's Permit">Driver's Permit</option>
                                                <option value="Guarantor Form">Guarantor Form</option>
                                            </>
                                        )}
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Upload File (Optional)</label>
                                    <input
                                        type="file"
                                        onChange={e => setData('document_file', e.target.files[0])}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:border-electric-blue outline-none"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {errors.document_file && <div className="text-rose-400 text-xs mt-1">{errors.document_file}</div>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Reference Number (Optional)</label>
                                        <input
                                            type="text"
                                            value={data.reference_number}
                                            onChange={e => setData('reference_number', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                            placeholder="e.g. License ID"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Issuing Authority (Optional)</label>
                                        <input
                                            type="text"
                                            value={data.issuing_authority}
                                            onChange={e => setData('issuing_authority', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                            placeholder="e.g. FRSC, NYDMV"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Or Document URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.url}
                                        onChange={e => setData('url', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue outline-none"
                                        placeholder="https://..."
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

            <BulkImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Compliance Documents"
                importRoute="dashboard.compliance.import"
                templateHeaders={['entity_type', 'entity_identifier', 'document_type', 'expiry_date']}
                templateFilename="FKG.Fleet_compliance_template.csv"
            />
        </DashboardLayout>
    );
}
