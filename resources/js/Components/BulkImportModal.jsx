import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from '@inertiajs/react';
import { X, Upload, Download, FileText } from 'lucide-react';

export default function BulkImportModal({ isOpen, onClose, title, importRoute, templateHeaders, templateFilename }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
    });
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('file', file);
            setFileName(file.name);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route(importRoute), {
            onSuccess: () => {
                onClose();
                reset();
                setFileName('');
            },
        });
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8," + templateHeaders.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", templateFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="glass-panel w-full max-w-md overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-electric-blue" />
                                {title}
                            </h2>
                            <button onClick={() => { onClose(); reset(); setFileName(''); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="p-6 flex flex-col gap-6">
                            
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm text-gray-300">
                                <p className="mb-3">To ensure your data imports correctly, please use our standardized CSV template.</p>
                                <button type="button" onClick={downloadTemplate} className="text-electric-blue hover:text-sky-400 font-medium flex items-center gap-2 transition-colors">
                                    <Download className="w-4 h-4" />
                                    Download CSV Template
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Upload CSV File</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept=".csv,.txt"
                                        onChange={handleFileChange} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                        required 
                                    />
                                    <div className={`w-full bg-black/30 border-2 border-dashed ${fileName ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10'} rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors`}>
                                        <Upload className={`w-8 h-8 mb-3 ${fileName ? 'text-emerald-400' : 'text-gray-500'}`} />
                                        <div className="text-sm font-medium text-white">
                                            {fileName ? fileName : 'Click or drag file here'}
                                        </div>
                                        {!fileName && <div className="text-xs text-gray-500 mt-1">Accepts .csv format</div>}
                                    </div>
                                </div>
                                {errors.file && <div className="text-rose-400 text-xs mt-2">{errors.file}</div>}
                            </div>

                            <div className="mt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => { onClose(); reset(); setFileName(''); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" disabled={processing || !data.file} className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-electric-blue/20 disabled:opacity-50">
                                    {processing ? 'Processing...' : 'Upload & Process'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
