import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { DollarSign, TrendingUp, TrendingDown, Wrench, Fuel, Calendar, ChevronDown, Download, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '@/utils/exportUtils';

export default function FinancialReports({ maintenance_records, fuel_records, year, month, view_mode }) {
    const [viewMode, setViewMode] = useState(view_mode || 'monthly');
    const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(month || new Date().getMonth() + 1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Generate year options (last 5 years)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Navigate when filters change
    const applyFilters = (mode, yr, mo) => {
        const params = { view_mode: mode, year: yr };
        if (mode === 'monthly') params.month = mo;
        router.get(route('dashboard.financial-reports'), params, { preserveState: true });
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setIsDropdownOpen(false);
        applyFilters(mode, selectedYear, selectedMonth);
    };

    const handleYearChange = (yr) => {
        setSelectedYear(yr);
        applyFilters(viewMode, yr, selectedMonth);
    };

    const handleMonthChange = (mo) => {
        setSelectedMonth(mo);
        applyFilters(viewMode, selectedYear, mo);
    };

    // Compute totals
    const maintenanceTotal = useMemo(() =>
        maintenance_records.reduce((sum, r) => sum + Number(r.cost), 0), [maintenance_records]);
    const fuelTotal = useMemo(() =>
        fuel_records.reduce((sum, r) => sum + Number(r.cost), 0), [fuel_records]);
    const grandTotal = maintenanceTotal + fuelTotal;

    // Monthly breakdown for yearly view
    const monthlyBreakdown = useMemo(() => {
        if (viewMode !== 'yearly') return [];
        const breakdown = months.map((name, idx) => {
            const mo = idx + 1;
            const mCost = maintenance_records
                .filter(r => new Date(r.date).getMonth() + 1 === mo)
                .reduce((s, r) => s + Number(r.cost), 0);
            const fCost = fuel_records
                .filter(r => new Date(r.date).getMonth() + 1 === mo)
                .reduce((s, r) => s + Number(r.cost), 0);
            return { month: name, maintenance: mCost, fuel: fCost, total: mCost + fCost };
        });
        return breakdown;
    }, [viewMode, maintenance_records, fuel_records]);

    // Bar chart max for visual scaling
    const maxMonthlyTotal = useMemo(() =>
        Math.max(...monthlyBreakdown.map(b => b.total), 1), [monthlyBreakdown]);

    // Combined records for table
    const combinedRecords = useMemo(() => {
        const mRecords = maintenance_records.map(r => ({
            id: `m-${r.id}`,
            date: r.date,
            type: 'Maintenance',
            category: r.service_type || r.type,
            vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.license_plate})` : 'Unknown',
            cost: Number(r.cost),
        }));
        const fRecords = fuel_records.map(r => ({
            id: `f-${r.id}`,
            date: r.date,
            type: 'Fuel',
            category: `${r.liters} L`,
            vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.license_plate})` : 'Unknown',
            cost: Number(r.cost),
        }));
        return [...mRecords, ...fRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [maintenance_records, fuel_records]);

    // Export to Excel
    const handleExportExcel = () => {
        const exportColumns = [
            { header: 'Date', key: 'date' },
            { header: 'Type', key: 'type' },
            { header: 'Category', key: 'category' },
            { header: 'Vehicle', key: 'vehicle' },
            { header: 'Cost (₦)', key: 'cost' },
        ];

        const exportData = combinedRecords.map(r => ({
            date: new Date(r.date).toLocaleDateString(),
            type: r.type,
            category: r.category,
            vehicle: r.vehicle,
            cost: r.cost,
        }));

        // Add summary row at the end
        exportData.push(
            { date: '', type: '', category: '', vehicle: '', cost: '' },
            { date: 'SUMMARY', type: '', category: '', vehicle: 'Total Maintenance', cost: maintenanceTotal },
            { date: '', type: '', category: '', vehicle: 'Total Fuel', cost: fuelTotal },
            { date: '', type: '', category: '', vehicle: 'GRAND TOTAL', cost: grandTotal },
        );

        const period = viewMode === 'monthly'
            ? `${months[selectedMonth - 1]}_${selectedYear}`
            : `${selectedYear}`;

        exportToExcel(exportData, exportColumns, `Financial_Report_${period}`);
    };

    // Period label
    const periodLabel = viewMode === 'monthly'
        ? `${months[selectedMonth - 1]} ${selectedYear}`
        : `${selectedYear}`;

    // Percentage split
    const maintenancePct = grandTotal > 0 ? ((maintenanceTotal / grandTotal) * 100).toFixed(1) : 0;
    const fuelPct = grandTotal > 0 ? ((fuelTotal / grandTotal) * 100).toFixed(1) : 0;

    return (
        <DashboardLayout>
            <Head title="Financial Reports - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/20">
                                <BarChart3 className="w-6 h-6 text-emerald-400" />
                            </div>
                            Financial Reports
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Accepted requests cost breakdown — {periodLabel}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        {/* View Mode Dropdown */}
                        <div className="relative">
                            <button
                                id="financial-reports-view-mode-dropdown"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm hover:border-white/20 transition-colors min-w-[130px]"
                            >
                                <Calendar className="w-4 h-4 text-electric-blue" />
                                {viewMode === 'monthly' ? 'Monthly' : 'Yearly'}
                                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute right-0 mt-2 w-40 bg-gray-800 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
                                    >
                                        <button
                                            id="financial-reports-view-monthly"
                                            onClick={() => handleViewModeChange('monthly')}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${viewMode === 'monthly' ? 'bg-electric-blue/20 text-electric-blue' : 'text-gray-300 hover:bg-white/5'}`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            id="financial-reports-view-yearly"
                                            onClick={() => handleViewModeChange('yearly')}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${viewMode === 'yearly' ? 'bg-electric-blue/20 text-electric-blue' : 'text-gray-300 hover:bg-white/5'}`}
                                        >
                                            Yearly
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Year Selector */}
                        <select
                            id="financial-reports-year-selector"
                            value={selectedYear}
                            onChange={e => handleYearChange(Number(e.target.value))}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-electric-blue outline-none [color-scheme:dark]"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        {/* Month Selector (only for monthly view) */}
                        {viewMode === 'monthly' && (
                            <select
                                id="financial-reports-month-selector"
                                value={selectedMonth}
                                onChange={e => handleMonthChange(Number(e.target.value))}
                                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-electric-blue outline-none [color-scheme:dark]"
                            >
                                {months.map((m, idx) => (
                                    <option key={idx + 1} value={idx + 1}>{m}</option>
                                ))}
                            </select>
                        )}

                        {/* Export Excel Button */}
                        <button
                            id="financial-reports-export-excel"
                            onClick={handleExportExcel}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-lg font-medium transition-colors border border-emerald-500/30 flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-gray-400 font-medium text-sm">Grand Total</div>
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white relative z-10">
                            ₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 relative z-10">{combinedRecords.length} accepted requests</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-gray-400 font-medium text-sm">Maintenance</div>
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Wrench className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white relative z-10">
                            ₦{maintenanceTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 mt-2 relative z-10">
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-amber-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${maintenancePct}%` }} />
                            </div>
                            <span className="text-xs text-amber-400 font-medium whitespace-nowrap">{maintenancePct}%</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-bl-full" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-gray-400 font-medium text-sm">Fuel</div>
                            <div className="p-2 bg-rose-500/10 rounded-lg">
                                <Fuel className="w-5 h-5 text-rose-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white relative z-10">
                            ₦{fuelTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 mt-2 relative z-10">
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-rose-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${fuelPct}%` }} />
                            </div>
                            <span className="text-xs text-rose-400 font-medium whitespace-nowrap">{fuelPct}%</span>
                        </div>
                    </motion.div>
                </div>

                {/* Yearly Monthly Breakdown Chart */}
                {viewMode === 'yearly' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-panel p-6 mb-8"
                    >
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-electric-blue" />
                            Monthly Breakdown — {selectedYear}
                        </h2>
                        <div className="space-y-3">
                            {monthlyBreakdown.map((item, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-400 w-12 shrink-0 text-right font-mono">{item.month.slice(0, 3)}</span>
                                        <div className="flex-1 flex h-7 rounded-lg overflow-hidden bg-white/5">
                                            {item.maintenance > 0 && (
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.maintenance / maxMonthlyTotal) * 100}%` }}
                                                    transition={{ delay: 0.05 * idx, duration: 0.6 }}
                                                    className="bg-gradient-to-r from-amber-500/60 to-amber-400/40 h-full relative group/bar"
                                                    title={`Maintenance: ₦${item.maintenance.toLocaleString()}`}
                                                />
                                            )}
                                            {item.fuel > 0 && (
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.fuel / maxMonthlyTotal) * 100}%` }}
                                                    transition={{ delay: 0.05 * idx + 0.1, duration: 0.6 }}
                                                    className="bg-gradient-to-r from-rose-500/60 to-rose-400/40 h-full relative group/bar"
                                                    title={`Fuel: ₦${item.fuel.toLocaleString()}`}
                                                />
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-300 font-mono w-28 shrink-0 text-right">
                                            ₦{item.total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-amber-400/60" />
                                <span className="text-xs text-gray-400">Maintenance</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-rose-400/60" />
                                <span className="text-xs text-gray-400">Fuel</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Records Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: viewMode === 'yearly' ? 0.5 : 0.4 }}
                    className="glass-panel overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/20">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-electric-blue" />
                            Accepted Requests — {periodLabel}
                        </h2>
                        <div className="text-sm text-gray-400">
                            {combinedRecords.length} record{combinedRecords.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Date</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Type</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Category</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Vehicle</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Cost (₦)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {combinedRecords.map((record) => (
                                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-gray-300 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                record.type === 'Maintenance'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-rose-500/20 text-rose-400'
                                            }`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-300">{record.category}</td>
                                        <td className="p-4 text-gray-300">{record.vehicle}</td>
                                        <td className="p-4 text-white font-mono text-right font-medium">
                                            ₦{record.cost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {combinedRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-gray-400">
                                            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            No accepted requests found for {periodLabel}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {combinedRecords.length > 0 && (
                                <tfoot>
                                    <tr className="bg-black/30 border-t-2 border-white/10">
                                        <td colSpan="4" className="p-4 text-right font-bold text-white uppercase tracking-wider text-sm">Total Expenses</td>
                                        <td className="p-4 text-right font-bold text-emerald-400 text-lg font-mono">
                                            ₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
