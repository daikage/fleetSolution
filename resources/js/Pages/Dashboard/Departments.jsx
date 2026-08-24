import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Building2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Departments({ departments }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const { data: addData, setData: setAddData, post: postAdd, processing: addProcessing, errors: addErrors, reset: resetAdd } = useForm({
        name: '',
    });

    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
    });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        postAdd(route('dashboard.departments'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                resetAdd();
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        putEdit(route('dashboard.departments.update', selectedDepartment.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedDepartment(null);
            },
        });
    };

    const handleDelete = (department) => {
        if (confirm(`Are you sure you want to delete ${department.name}?`)) {
            router.delete(route('dashboard.departments.destroy', department.id));
        }
    };

    const openEditModal = (department) => {
        setSelectedDepartment(department);
        setEditData('name', department.name);
        setIsEditModalOpen(true);
    };

    return (
        <DashboardLayout>
            <Head title="Departments - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-electric-blue" />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Departments</h1>
                            <p className="text-gray-400 mt-1 text-sm md:text-base">Manage company departments and vehicle assignments</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-electric-blue hover:bg-sky-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-electric-blue/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        Add Department
                    </button>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300">Department Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Assigned Vehicles</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.map((department) => (
                                    <tr key={department.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white">{department.name}</div>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {department.vehicles_count || 0}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(department)}
                                                    className="p-2 text-gray-400 hover:text-electric-blue bg-white/5 rounded-lg hover:bg-electric-blue/10 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(department)}
                                                    className="p-2 text-gray-400 hover:text-rose-400 bg-white/5 rounded-lg hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {departments.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-400">
                                            No departments found. Create one to get started.
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Add Department</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Department Name</label>
                                    <input
                                        type="text"
                                        value={addData.name}
                                        onChange={e => setAddData('name', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        placeholder="e.g. Sales"
                                        required
                                    />
                                    {addErrors.name && <div className="text-rose-400 text-xs mt-1">{addErrors.name}</div>}
                                </div>
                                <div className="flex gap-3 pt-2 mt-6">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={addProcessing} className="flex-1 py-2.5 rounded-lg font-medium bg-electric-blue hover:bg-sky-400 text-white shadow-lg shadow-electric-blue/20 transition-all disabled:opacity-50">
                                        {addProcessing ? 'Saving...' : 'Save Department'}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold text-white">Edit Department</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Department Name</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={e => setEditData('name', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                        required
                                    />
                                    {editErrors.name && <div className="text-rose-400 text-xs mt-1">{editErrors.name}</div>}
                                </div>
                                <div className="flex gap-3 pt-2 mt-6">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editProcessing} className="flex-1 py-2.5 rounded-lg font-medium bg-electric-blue hover:bg-sky-400 text-white shadow-lg shadow-electric-blue/20 transition-all disabled:opacity-50">
                                        {editProcessing ? 'Saving...' : 'Update Department'}
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
