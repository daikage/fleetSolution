import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FileText, Calendar, Wrench, Fuel, Car, Users, TrendingUp } from 'lucide-react';
import ExportButtons from '@/Components/ExportButtons';

export default function Reports({ summary, maintenance_records, fuel_records }) {
    const [dateRange, setDateRange] = useState({
        start: summary.period_start,
        end: summary.period_end
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('dashboard.reports'), dateRange, { preserveState: true });
    };

    const combinedExportColumns = [
        { header: 'Date', key: 'date' },
        { header: 'Type', key: 'type' },
        { header: 'Vehicle', key: 'vehicle' },
        { header: 'Details', key: 'details' },
        { header: 'Cost (₦)', key: 'cost' }
    ];

    const maintenanceData = maintenance_records.map(r => ({
        date: new Date(r.date).toLocaleDateString(),
        type: 'Maintenance',
        vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.license_plate})` : 'Unknown',
        details: r.service_type,
        cost: r.cost
    }));

    const fuelData = fuel_records.map(r => ({
        date: new Date(r.date).toLocaleDateString(),
        type: 'Fuel',
        vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.license_plate})` : 'Unknown',
        details: `${r.liters} L`,
        cost: r.cost
    }));

    const exportData = [...maintenanceData, ...fuelData].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <DashboardLayout>
            <Head title="Reports - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Review fleet performance and financial summaries</p>
                    </div>
                    
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-1">
                            <input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                                className="bg-transparent text-white text-sm border-none focus:ring-0 outline-none [color-scheme:dark]" 
                            />
                            <span className="text-gray-500">to</span>
                            <input 
                                type="date" 
                                value={dateRange.end} 
                                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                                className="bg-transparent text-white text-sm border-none focus:ring-0 outline-none [color-scheme:dark]" 
                            />
                        </div>
                        <button type="submit" className="bg-electric-blue hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto">
                            Filter
                        </button>
                        <div className="hidden sm:block w-px h-8 bg-white/10 mx-2"></div>
                        <ExportButtons data={exportData} columns={combinedExportColumns} filename={`Fleet_Report_${summary.period_start}_${summary.period_end}`} title={`Fleet Summary Report (${summary.period_start} to ${summary.period_end})`} />
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="glass-panel p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-gray-400 font-medium">Total Vehicles</div>
                            <div className="p-2 bg-white/5 rounded-lg text-emerald-400"><Car className="w-5 h-5" /></div>
                        </div>
                        <div className="text-3xl font-bold text-white">{summary.total_vehicles}</div>
                    </div>
                    
                    <div className="glass-panel p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-gray-400 font-medium">Active Drivers</div>
                            <div className="p-2 bg-white/5 rounded-lg text-blue-400"><Users className="w-5 h-5" /></div>
                        </div>
                        <div className="text-3xl font-bold text-white">{summary.active_drivers}</div>
                    </div>
                    
                    <div className="glass-panel p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-gray-400 font-medium">Maintenance Costs</div>
                            <div className="p-2 bg-white/5 rounded-lg text-amber-400"><Wrench className="w-5 h-5" /></div>
                        </div>
                        <div className="text-3xl font-bold text-white">₦{Number(summary.total_maintenance_cost).toLocaleString()}</div>
                    </div>
                    
                    <div className="glass-panel p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-gray-400 font-medium">Fuel Costs</div>
                            <div className="p-2 bg-white/5 rounded-lg text-rose-400"><Fuel className="w-5 h-5" /></div>
                        </div>
                        <div className="text-3xl font-bold text-white">₦{Number(summary.total_fuel_cost).toLocaleString()}</div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-electric-blue" /> Expense Breakdown
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Date</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Category</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Vehicle</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Details</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exportData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-gray-300 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            {row.date}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.type === 'Maintenance' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-300">{row.vehicle}</td>
                                        <td className="p-4 text-gray-400">{row.details}</td>
                                        <td className="p-4 text-white font-mono text-right">
                                            ₦{Number(row.cost).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {exportData.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-gray-400">
                                            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            No financial records found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {exportData.length > 0 && (
                                <tfoot>
                                    <tr className="bg-black/30 border-t-2 border-white/10">
                                        <td colSpan="4" className="p-4 text-right font-bold text-white uppercase tracking-wider text-sm">Total Expenses</td>
                                        <td className="p-4 text-right font-bold text-emerald-400 text-lg font-mono">
                                            ₦{(Number(summary.total_maintenance_cost) + Number(summary.total_fuel_cost)).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
