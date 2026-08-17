import { useState, useMemo, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ClipboardCheck, Wrench, Fuel, Calendar, ChevronDown, ChevronUp, Download, Printer, Send, Search, Filter, CheckCircle, XCircle, Clock, Eye, X, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';

export default function ApprovalDesk({ maintenances, fuelLogs, summary, userRole }) {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);
    const [sendingInvoice, setSendingInvoice] = useState(null);
    const printRef = useRef(null);

    // Status badge styles
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Accepted':
                return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> };
            case 'Rejected':
                return { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: <XCircle className="w-3.5 h-3.5" /> };
            case 'Under Review':
                return { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Eye className="w-3.5 h-3.5" /> };
            case 'Pending':
            default:
                return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Clock className="w-3.5 h-3.5" /> };
        }
    };

    // Combine records
    const combinedRecords = useMemo(() => {
        const mRecords = maintenances.map(r => ({
            id: r.id,
            uniqueKey: `m-${r.id}`,
            date: r.date,
            type: 'Maintenance',
            category: r.service_type || r.type,
            vehicle: r.vehicle ? `${r.vehicle.make || ''} ${r.vehicle.model || ''} (${r.vehicle.license_plate})`.trim() : 'Unknown',
            cost: Number(r.cost),
            status: r.status,
            reviewerComment: r.reviewer_comment,
            assignedTo: r.assigned_to_user?.name || r.assigned_to?.name || '—',
            createdBy: r.created_by_user?.name || r.created_by?.name || '—',
            diagnosis: r.diagnosis,
            workToBeDone: r.work_to_be_done,
            vehicleLocation: r.vehicle_location,
            handledBy: r.handled_by,
            supervisedBy: r.supervised_by,
            vehicleUser: r.vehicle_user,
            vendors: r.vendors || [],
            recordType: 'maintenance',
        }));
        const fRecords = fuelLogs.map(r => ({
            id: r.id,
            uniqueKey: `f-${r.id}`,
            date: r.date,
            type: 'Fuel',
            category: `${r.liters} L`,
            vehicle: r.vehicle ? `${r.vehicle.make || ''} ${r.vehicle.model || ''} (${r.vehicle.license_plate})`.trim() : 'Unknown',
            cost: Number(r.cost),
            status: r.status,
            reviewerComment: r.reviewer_comment,
            assignedTo: r.assigned_to_user?.name || r.assigned_to?.name || '—',
            createdBy: '—',
            driverName: r.driver?.user?.name || '—',
            liters: r.liters,
            odometerAtFill: r.odometer_at_fill,
            vendors: [],
            recordType: 'fuel',
        }));

        let records = [];
        if (activeTab === 'maintenance') records = mRecords;
        else if (activeTab === 'fuel') records = fRecords;
        else records = [...mRecords, ...fRecords];

        // Apply status filter
        if (statusFilter !== 'all') {
            records = records.filter(r => r.status === statusFilter);
        }

        // Apply search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            records = records.filter(r =>
                r.vehicle.toLowerCase().includes(q) ||
                r.type.toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q) ||
                r.status.toLowerCase().includes(q) ||
                String(r.cost).includes(q)
            );
        }

        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [maintenances, fuelLogs, activeTab, statusFilter, searchQuery]);

    // Handle print invoice
    const handlePrint = (record) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        const vendorRows = record.vendors.map(v =>
            `<tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${v.vendor_name}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">₦${Number(v.vendor_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${v.additional_comments || '—'}</td>
            </tr>`
        ).join('');

        const statusColor = record.status === 'Accepted' ? '#16a34a' : record.status === 'Rejected' ? '#dc2626' : record.status === 'Under Review' ? '#2563eb' : '#d97706';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice — ${record.type} Request #${record.id}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; padding: 40px; }
                    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #0ea5e9; }
                    .company-name { font-size: 28px; font-weight: bold; color: #0ea5e9; }
                    .invoice-title { font-size: 18px; color: #6b7280; margin-top: 4px; }
                    .invoice-number { text-align: right; }
                    .invoice-number h2 { font-size: 22px; color: #111827; }
                    .invoice-number p { color: #6b7280; font-size: 14px; margin-top: 4px; }
                    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                    .detail-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; font-weight: 600; }
                    .detail-section p { font-size: 14px; color: #374151; line-height: 1.6; }
                    .status-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                    th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
                    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
                    .total-row { background: #f0f9ff; }
                    .total-row td { font-weight: bold; font-size: 18px; color: #0ea5e9; border-top: 2px solid #0ea5e9; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <div>
                        <div class="company-name">FKG.Fleet</div>
                        <div class="invoice-title">Fleet Management System</div>
                    </div>
                    <div class="invoice-number">
                        <h2>INVOICE</h2>
                        <p>${record.type} Request #${record.id}</p>
                        <p>${record.date ? new Date(record.date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                    </div>
                </div>

                <div class="detail-grid">
                    <div class="detail-section">
                        <h3>Vehicle</h3>
                        <p>${record.vehicle}</p>
                    </div>
                    <div class="detail-section">
                        <h3>Status</h3>
                        <p><span class="status-badge" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40;">${record.status}</span></p>
                    </div>
                    <div class="detail-section">
                        <h3>Category</h3>
                        <p>${record.category}</p>
                    </div>
                    ${record.type === 'Maintenance' ? `
                        <div class="detail-section">
                            <h3>Handled By</h3>
                            <p>${record.handledBy || '—'}</p>
                        </div>
                        ${record.diagnosis ? `<div class="detail-section"><h3>Diagnosis</h3><p>${record.diagnosis}</p></div>` : ''}
                        ${record.workToBeDone ? `<div class="detail-section"><h3>Work To Be Done</h3><p>${record.workToBeDone}</p></div>` : ''}
                    ` : `
                        <div class="detail-section">
                            <h3>Driver</h3>
                            <p>${record.driverName || '—'}</p>
                        </div>
                        <div class="detail-section">
                            <h3>Liters</h3>
                            <p>${record.liters || '—'} L</p>
                        </div>
                        <div class="detail-section">
                            <h3>Odometer</h3>
                            <p>${record.odometerAtFill ? Number(record.odometerAtFill).toLocaleString() + ' km' : '—'}</p>
                        </div>
                    `}
                </div>

                ${record.vendors.length > 0 ? `
                    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 12px; font-weight: 600;">Vendor Breakdown</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Price (₦)</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vendorRows}
                        </tbody>
                    </table>
                ` : ''}

                <table>
                    <tbody>
                        <tr class="total-row">
                            <td style="text-align: right; padding-right: 24px;">TOTAL</td>
                            <td>₦${record.cost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>

                ${record.reviewerComment ? `
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-top: 16px;">
                        <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; font-weight: 600;">Reviewer Comment</h3>
                        <p style="font-style: italic; color: #4b5563; font-size: 14px;">"${record.reviewerComment}"</p>
                    </div>
                ` : ''}

                <div class="footer">
                    <p>Generated by FKG.Fleet Management System — ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    };

    // Handle send invoice email
    const handleSendInvoice = (record) => {
        if (sendingInvoice) return;
        setSendingInvoice(record.uniqueKey);
        router.post(route('dashboard.approval-desk.send-invoice', { type: record.recordType, id: record.id }), {}, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setSendingInvoice(null),
        });
    };

    // Export
    const handleExportExcel = () => {
        const exportColumns = [
            { header: 'Date', key: 'date' },
            { header: 'Type', key: 'type' },
            { header: 'Category', key: 'category' },
            { header: 'Vehicle', key: 'vehicle' },
            { header: 'Cost (₦)', key: 'cost' },
            { header: 'Status', key: 'status' },
        ];
        const exportData = combinedRecords.map(r => ({
            date: r.date ? new Date(r.date).toLocaleDateString() : '',
            type: r.type,
            category: r.category,
            vehicle: r.vehicle,
            cost: r.cost,
            status: r.status,
        }));
        exportToExcel(exportData, exportColumns, `Approval_Desk_Export_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportPDF = () => {
        const exportColumns = [
            { header: 'Date', key: 'date' },
            { header: 'Type', key: 'type' },
            { header: 'Category', key: 'category' },
            { header: 'Vehicle', key: 'vehicle' },
            { header: 'Cost (₦)', key: 'cost' },
            { header: 'Status', key: 'status' },
        ];
        const exportData = combinedRecords.map(r => ({
            date: r.date ? new Date(r.date).toLocaleDateString() : '',
            type: r.type,
            category: r.category,
            vehicle: r.vehicle,
            cost: r.cost,
            status: r.status,
        }));
        exportToPDF(exportData, exportColumns, `Approval_Desk_Export_${new Date().toISOString().split('T')[0]}`, 'Approval Desk — Request Summary');
    };

    const tabs = [
        { key: 'all', label: 'All Requests', count: maintenances.length + fuelLogs.length },
        { key: 'maintenance', label: 'Maintenance', count: maintenances.length },
        { key: 'fuel', label: 'Fuel', count: fuelLogs.length },
    ];

    return (
        <DashboardLayout>
            <Head title="Approval Desk - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl border border-violet-500/20">
                                <ClipboardCheck className="w-6 h-6 text-violet-400" />
                            </div>
                            Approval Desk
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Review requests, print invoices, and forward to management</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            id="approval-desk-export-excel"
                            onClick={handleExportExcel}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg font-medium transition-colors border border-emerald-500/30 flex items-center gap-2 text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Excel
                        </button>
                        <button
                            id="approval-desk-export-pdf"
                            onClick={handleExportPDF}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-2 rounded-lg font-medium transition-colors border border-rose-500/30 flex items-center gap-2 text-sm"
                        >
                            <Download className="w-4 h-4" />
                            PDF
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
                        <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">Pending</div>
                        <div className="text-2xl font-bold text-white">{summary.pending}</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                        <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Accepted</div>
                        <div className="text-2xl font-bold text-white">{summary.accepted}</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-bl-full" />
                        <div className="text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">Rejected</div>
                        <div className="text-2xl font-bold text-white">{summary.rejected}</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
                        <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">Under Review</div>
                        <div className="text-2xl font-bold text-white">{summary.under_review}</div>
                    </motion.div>
                </div>

                {/* Cost Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Accepted Cost</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            ₦{(Number(summary.total_maintenance_cost) + Number(summary.total_fuel_cost)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-panel p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                            <Wrench className="w-3.5 h-3.5" /> Maintenance Cost
                        </div>
                        <div className="text-2xl font-bold text-amber-400">
                            ₦{Number(summary.total_maintenance_cost).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-bl-full" />
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                            <Fuel className="w-3.5 h-3.5" /> Fuel Cost
                        </div>
                        <div className="text-2xl font-bold text-rose-400">
                            ₦{Number(summary.total_fuel_cost).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </div>
                    </motion.div>
                </div>

                {/* Tabs + Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                id={`approval-desk-tab-${tab.key}`}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    activeTab === tab.key
                                        ? 'bg-electric-blue/20 text-electric-blue shadow-lg shadow-electric-blue/10'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.key ? 'bg-electric-blue/30 text-electric-blue' : 'bg-white/10 text-gray-500'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                id="approval-desk-search"
                                type="text"
                                placeholder="Search requests..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none w-full sm:w-64 transition-colors"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                                id="approval-desk-status-filter"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="bg-black/30 border border-white/10 rounded-lg pl-10 pr-8 py-2.5 text-white text-sm focus:border-electric-blue outline-none appearance-none cursor-pointer [color-scheme:dark]"
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Under Review">Under Review</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="glass-panel overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300 w-10"></th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Date</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Type</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Vehicle</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Category</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Cost (₦)</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {combinedRecords.map((record) => {
                                    const statusBadge = getStatusBadge(record.status);
                                    const isExpanded = expandedRow === record.uniqueKey;

                                    return (
                                        <AnimatePresence key={record.uniqueKey}>
                                            <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                                                onClick={() => setExpandedRow(isExpanded ? null : record.uniqueKey)}
                                            >
                                                <td className="p-4 text-center">
                                                    <button className="text-gray-400 hover:text-white transition-colors">
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-gray-300 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                                        {record.date ? new Date(record.date).toLocaleDateString() : '—'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        record.type === 'Maintenance'
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'bg-cyan-500/20 text-cyan-400'
                                                    }`}>
                                                        {record.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-300 text-sm">{record.vehicle}</td>
                                                <td className="p-4 text-gray-300 text-sm">{record.category}</td>
                                                <td className="p-4 text-white font-mono text-right font-medium text-sm">
                                                    ₦{record.cost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
                                                        {statusBadge.icon}
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handlePrint(record)}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                            title="Print Invoice"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendInvoice(record)}
                                                            disabled={sendingInvoice === record.uniqueKey}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                sendingInvoice === record.uniqueKey
                                                                    ? 'text-gray-600 cursor-not-allowed'
                                                                    : 'text-violet-400 hover:text-violet-300 hover:bg-violet-500/10'
                                                            }`}
                                                            title="Send Invoice to Management"
                                                        >
                                                            <Send className={`w-4 h-4 ${sendingInvoice === record.uniqueKey ? 'animate-pulse' : ''}`} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Detail Row */}
                                            {isExpanded && (
                                                <tr className="bg-black/20 border-b border-white/5">
                                                    <td colSpan="8" className="p-6">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                                        >
                                                            {record.type === 'Maintenance' && (
                                                                <>
                                                                    {record.diagnosis && (
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Diagnosis</div>
                                                                            <div className="text-gray-300 text-sm">{record.diagnosis}</div>
                                                                        </div>
                                                                    )}
                                                                    {record.workToBeDone && (
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Work To Be Done</div>
                                                                            <div className="text-gray-300 text-sm">{record.workToBeDone}</div>
                                                                        </div>
                                                                    )}
                                                                    {record.vehicleLocation && (
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Vehicle Location</div>
                                                                            <div className="text-gray-300 text-sm">{record.vehicleLocation}</div>
                                                                        </div>
                                                                    )}
                                                                    {record.handledBy && (
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Handled By</div>
                                                                            <div className="text-gray-300 text-sm">{record.handledBy}</div>
                                                                        </div>
                                                                    )}
                                                                    {record.supervisedBy && (
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Supervised By</div>
                                                                            <div className="text-gray-300 text-sm">{record.supervisedBy}</div>
                                                                        </div>
                                                                    )}
                                                                    {record.vehicleUser && (
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Vehicle User</div>
                                                                            <div className="text-gray-300 text-sm">{record.vehicleUser}</div>
                                                                        </div>
                                                                    )}
                                                                    {record.vendors.length > 0 && (
                                                                        <div className="col-span-full">
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Vendors</div>
                                                                            <div className="space-y-2">
                                                                                {record.vendors.map((v, idx) => (
                                                                                    <div key={idx} className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-2.5 border border-white/5">
                                                                                        <div>
                                                                                            <div className="text-white text-sm font-medium">{v.vendor_name}</div>
                                                                                            {v.additional_comments && <div className="text-gray-500 text-xs mt-0.5">{v.additional_comments}</div>}
                                                                                        </div>
                                                                                        <div className="text-amber-400 font-mono text-sm font-medium">
                                                                                            ₦{Number(v.vendor_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                            {record.type === 'Fuel' && (
                                                                <>
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Driver</div>
                                                                        <div className="text-gray-300 text-sm">{record.driverName || '—'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Liters</div>
                                                                        <div className="text-gray-300 text-sm">{record.liters || '—'} L</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Odometer at Fill</div>
                                                                        <div className="text-gray-300 text-sm">{record.odometerAtFill ? `${Number(record.odometerAtFill).toLocaleString()} km` : '—'}</div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {record.reviewerComment && (
                                                                <div className="col-span-full">
                                                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Reviewer Comment</div>
                                                                    <div className="bg-electric-blue/5 border border-electric-blue/10 rounded-lg px-4 py-3">
                                                                        <p className="text-gray-300 text-sm italic">"{record.reviewerComment}"</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Action buttons in expanded view */}
                                                            <div className="col-span-full flex items-center gap-3 mt-2 pt-4 border-t border-white/5">
                                                                <button
                                                                    onClick={() => handlePrint(record)}
                                                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                    Print Invoice
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSendInvoice(record)}
                                                                    disabled={sendingInvoice === record.uniqueKey}
                                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                                                        sendingInvoice === record.uniqueKey
                                                                            ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                                                                            : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border-violet-500/30'
                                                                    }`}
                                                                >
                                                                    <Send className={`w-4 h-4 ${sendingInvoice === record.uniqueKey ? 'animate-pulse' : ''}`} />
                                                                    {sendingInvoice === record.uniqueKey ? 'Sending...' : 'Send to Management'}
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    );
                                })}

                                {combinedRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center text-gray-400">
                                            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            <p className="text-lg font-medium mb-1">No requests found</p>
                                            <p className="text-sm text-gray-500">
                                                {searchQuery || statusFilter !== 'all'
                                                    ? 'Try adjusting your search or filter criteria.'
                                                    : 'There are no requests to display yet.'
                                                }
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
