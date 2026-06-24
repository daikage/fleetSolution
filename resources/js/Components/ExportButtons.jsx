import { Download, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';

export default function ExportButtons({ data, columns, filename, title }) {
    const handleExcel = () => {
        exportToExcel(data, columns, filename);
    };

    const handlePDF = () => {
        exportToPDF(data, columns, filename, title);
    };

    return (
        <div className="flex gap-2">
            <button 
                onClick={handleExcel}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg font-medium transition-colors border border-emerald-500/30 flex items-center gap-2 text-sm"
            >
                <Download className="w-4 h-4" />
                Excel
            </button>
            <button 
                onClick={handlePDF}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-4 py-2 rounded-lg font-medium transition-colors border border-rose-500/30 flex items-center gap-2 text-sm"
            >
                <FileText className="w-4 h-4" />
                PDF
            </button>
        </div>
    );
}
