import { useState, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import BulkImportModal from '@/Components/BulkImportModal';
import { Plus, User as UserIcon, X, Trash2, FileText, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportButtons from '@/Components/ExportButtons';

export default function Drivers({ drivers }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        license_no: '',
        license_exp: '',
        passport_photo: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('passport_photo', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('dashboard.drivers'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                setPreviewUrl(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Name', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'License No', key: 'license_no' },
        { header: 'License Expiry', key: 'license_exp' }
    ];

    const exportData = drivers.map(d => ({
        name: d.user?.name || 'Unknown',
        email: d.user?.email || 'N/A',
        license_no: d.license_no,
        license_exp: new Date(d.license_exp).toLocaleDateString()
    }));

    return (
        <DashboardLayout>
            <Head title="Drivers - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Drivers</h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Manage personnel and assignments</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <ExportButtons data={exportData} columns={exportColumns} filename="Fleet_Drivers" title="Fleet Drivers Registry" />
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
                            Assign Driver
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drivers.map((driver) => (
                        <div key={driver.id} className="glass-panel p-6 flex flex-col items-center text-center relative group">
                            <Link
                                href={route('dashboard.drivers.destroy', driver.id)}
                                method="delete"
                                as="button"
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-rose-400 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Link>

                            <div className="w-24 h-24 bg-gradient-to-tr from-electric-blue to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-4 border-2 border-white/10 overflow-hidden">
                                {driver.passport_photo ? (
                                    <img src={driver.passport_photo} alt={driver.user?.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white">
                                        {driver.user?.name?.substring(0, 2).toUpperCase() || 'NA'}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white">{driver.user?.name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-400 mt-1">{driver.user?.email}</p>

                            <div className="w-full h-px bg-white/10 my-4"></div>

                            <div className="w-full flex justify-between text-sm">
                                <span className="text-gray-400">License No</span>
                                <span className="text-white font-mono">{driver.license_no}</span>
                            </div>
                            <div className="w-full flex justify-between text-sm mt-2">
                                <span className="text-gray-400">Expires</span>
                                <span className="text-white">{new Date(driver.license_exp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}

                    {drivers.length === 0 && (
                        <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/20 bg-transparent">
                            <UserIcon className="w-12 h-12 text-gray-500 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No drivers registered</h3>
                            <p className="text-gray-400 max-w-md">Assign a system user as a driver to track their shifts and metrics.</p>
                        </div>
                    )}
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
                                <h2 className="text-xl font-bold text-white">Assign New Driver</h2>
                                <button onClick={() => { setIsModalOpen(false); reset(); setPreviewUrl(null); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                                
                                <div className="flex flex-col items-center mb-2">
                                    <div 
                                        className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-electric-blue transition-colors group relative"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400 group-hover:text-electric-blue transition-colors">
                                                <Camera className="w-8 h-8 mb-1" />
                                                <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                    {errors.passport_photo && <div className="text-rose-400 text-xs mt-2">{errors.passport_photo}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="Jane Doe" required />
                                    {errors.name && <div className="text-rose-400 text-xs mt-1">{errors.name}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="jane@fleet.com" required />
                                    {errors.email && <div className="text-rose-400 text-xs mt-1">{errors.email}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Temporary Password</label>
                                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none" placeholder="••••••••" required />
                                    {errors.password && <div className="text-rose-400 text-xs mt-1">{errors.password}</div>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">License Number</label>
                                        <input type="text" value={data.license_no} onChange={e => setData('license_no', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none font-mono" placeholder="DL-123456" required />
                                        {errors.license_no && <div className="text-rose-400 text-xs mt-1">{errors.license_no}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Expiration Date</label>
                                        <input type="date" value={data.license_exp} onChange={e => setData('license_exp', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none [color-scheme:dark]" required />
                                        {errors.license_exp && <div className="text-rose-400 text-xs mt-1">{errors.license_exp}</div>}
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setIsModalOpen(false); reset(); setPreviewUrl(null); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-electric-blue/20 disabled:opacity-50">
                                        {processing ? 'Creating...' : 'Create Driver'}
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
                title="Import Drivers"
                importRoute="dashboard.drivers.import"
                templateHeaders={['name', 'email', 'password', 'license_no', 'license_exp']}
                templateFilename="FKG.Fleet_drivers_template.csv"
            />
        </DashboardLayout>
    );
}
