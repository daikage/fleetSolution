import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export a dataset to an Excel file (.xlsx)
 * @param {Array} data - The array of objects to export
 * @param {Array} columns - Array of objects { header: 'Column Name', key: 'dataKey' }
 * @param {string} filename - The name of the file without extension
 */
export const exportToExcel = (data, columns, filename) => {
    const headers = columns.map(col => col.header);
    const rows = data.map(row => {
        return columns.map(col => row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '');
    });
    
    const aoa = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export a dataset to a PDF file (.pdf)
 * @param {Array} data - The array of objects to export
 * @param {Array} columns - Array of objects { header: 'Column Name', key: 'dataKey' }
 * @param {string} filename - The name of the file without extension
 * @param {string} title - The title printed at the top of the PDF
 */
export const exportToPDF = (data, columns, filename, title = "Data Export") => {
    const doc = new jsPDF();
    
    const head = [columns.map(col => col.header)];
    const body = data.map(row => columns.map(col => String(row[col.key] || '')));

    doc.setFontSize(18);
    doc.text(title, 14, 22);

    doc.autoTable({
        head: head,
        body: body,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 165, 233] }
    });

    doc.save(`${filename}.pdf`);
};
