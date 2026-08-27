import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Store, Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Vendors({ vendors }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    const { data: addData, setData: setAddData, post: postAdd, processing: addProcessing, errors: addErrors, reset: resetAdd } = useForm({
        name: '',
        address: '',
        phone: '',
        email: '',
        tax_id: '',
    });

    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        address: '',
        phone: '',
        email: '',
        tax_id: '',
    });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        postAdd(route('dashboard.vendors'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                resetAdd();
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        putEdit(route('dashboard.vendors.update', selectedVendor.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedVendor(null);
            },
        });
    };

    const handleDelete = (vendor) => {
        if (confirm(`Are you sure you want to delete ${vendor.name}?`)) {
            router.delete(route('dashboard.vendors.destroy', vendor.id));
        }
    };

    const openEditModal = (vendor) => {
        setSelectedVendor(vendor);
        setEditData({
            name: vendor.name,
            address: vendor.address,
            phone: vendor.phone,
            email: vendor.email || '',
            tax_id: vendor.tax_id || '',
        });
        setIsEditModalOpen(true);
    };

    return (
        <DashboardLayout>
            <Head title="Vendors - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <Store className="w-8 h-8 text-electric-blue" />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Vendors</h1>
                            <p className="text-gray-400 mt-1 text-sm md:text-base">Manage company vendors and their details</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-electric-blue hover:bg-sky-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        Add Vendor
                    </button>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Address</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Phone</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Email</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white">{vendor.name}</div>
                                            {vendor.tax_id && <div className="text-xs text-gray-400 mt-0.5">TIN: {vendor.tax_id}</div>}
                                        </td>
                                        <td className="p-4 text-gray-300 max-w-xs truncate" title={vendor.address}>
                                            {vendor.address}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {vendor.phone}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {vendor.email || '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(vendor)}
                                                    className="p-2 text-gray-400 hover:text-electric-blue bg-white/5 rounded-lg hover:bg-electric-blue/10 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(vendor)}
                                                    className="p-2 text-gray-400 hover:text-rose-400 bg-white/5 rounded-lg hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {vendors.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400">
                                            No vendors found. Create one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-lg overflow-hidden flex flex-col my-auto"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Add Vendor</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Vendor Name</label>
                                        <input
                                            type="text"
                                            value={addData.name}
                                            onChange={e => setAddData('name', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                            required
                                        />
                                        {addErrors.name && <div className="text-rose-400 text-xs mt-1">{addErrors.name}</div>}
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                        <textarea
                                            value={addData.address}
                                            onChange={e => setAddData('address', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none min-h-[80px]"
                                            required
                                        />
                                        {addErrors.address && <div className="text-rose-400 text-xs mt-1">{addErrors.address}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Phone No</label>
                                        <input
                                            type="text"
                                            value={addData.phone}
                                            onChange={e => setAddData('phone', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                            required
                                        />
                                        {addErrors.phone && <div className="text-rose-400 text-xs mt-1">{addErrors.phone}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={addData.email}
                                            onChange={e => setAddData('email', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        />
                                        {addErrors.email && <div className="text-rose-400 text-xs mt-1">{addErrors.email}</div>}
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">TAX ID (TIN) (Optional)</label>
                                        <input
                                            type="text"
                                            value={addData.tax_id}
                                            onChange={e => setAddData('tax_id', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        />
                                        {addErrors.tax_id && <div className="text-rose-400 text-xs mt-1">{addErrors.tax_id}</div>}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2 mt-6">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={addProcessing} className="flex-1 py-2.5 rounded-lg font-medium bg-electric-blue hover:bg-sky-400 text-white shadow-lg shadow-electric-blue/20 transition-all disabled:opacity-50">
                                        {addProcessing ? 'Saving...' : 'Save Vendor'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-lg overflow-hidden flex flex-col my-auto"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Edit Vendor</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Vendor Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={e => setEditData('name', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                            required
                                        />
                                        {editErrors.name && <div className="text-rose-400 text-xs mt-1">{editErrors.name}</div>}
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                        <textarea
                                            value={editData.address}
                                            onChange={e => setEditData('address', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none min-h-[80px]"
                                            required
                                        />
                                        {editErrors.address && <div className="text-rose-400 text-xs mt-1">{editErrors.address}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Phone No</label>
                                        <input
                                            type="text"
                                            value={editData.phone}
                                            onChange={e => setEditData('phone', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                            required
                                        />
                                        {editErrors.phone && <div className="text-rose-400 text-xs mt-1">{editErrors.phone}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={e => setEditData('email', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        />
                                        {editErrors.email && <div className="text-rose-400 text-xs mt-1">{editErrors.email}</div>}
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">TAX ID (TIN) (Optional)</label>
                                        <input
                                            type="text"
                                            value={editData.tax_id}
                                            onChange={e => setEditData('tax_id', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        />
                                        {editErrors.tax_id && <div className="text-rose-400 text-xs mt-1">{editErrors.tax_id}</div>}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2 mt-6">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editProcessing} className="flex-1 py-2.5 rounded-lg font-medium bg-electric-blue hover:bg-sky-400 text-white shadow-lg shadow-electric-blue/20 transition-all disabled:opacity-50">
                                        {editProcessing ? 'Saving...' : 'Save Vendor'}
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
