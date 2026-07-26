import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Shield, UserPlus, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function Users({ users }) {
    const [expandedUserId, setExpandedUserId] = useState(null);

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'superadmin':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            case 'admin':
                return 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30';
            case 'manager':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            case 'driver':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    const toggleExpand = (userId) => {
        setExpandedUserId(expandedUserId === userId ? null : userId);
    };

    return (
        <DashboardLayout>
            <Head title="User Management - FKG.Fleet" />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-electric-blue" />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">User Management</h1>
                            <p className="text-gray-400 mt-1 text-sm md:text-base">Manage user roles and permissions</p>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                            <div>
                                <p className="text-red-400 text-sm font-semibold">Super Admin Only</p>
                                <p className="text-red-300 text-xs mt-1">This page is restricted to super administrators only. Changes made here affect system-wide permissions.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-4 text-sm font-semibold text-gray-300 w-10"></th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">User</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Email</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const isExpanded = expandedUserId === user.id;

                                    return (
                                        <React.Fragment key={user.id}>
                                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => toggleExpand(user.id)}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{user.name}</div>
                                                </td>
                                                <td className="p-4 text-gray-300">{user.email}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-black/20 border-b border-white/5">
                                                    <td colSpan="4" className="p-6">
                                                        <div className="max-w-2xl">
                                                            <h3 className="text-sm font-semibold text-gray-300 mb-4">Change User Role</h3>
                                                            <form
                                                                action={`/dashboard/users/${user.id}`}
                                                                method="PUT"
                                                                className="space-y-4"
                                                            >
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Select New Role</label>
                                                                    <select
                                                                        name="role"
                                                                        defaultValue={user.role}
                                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                                                                    >
                                                                        <option value="admin">Admin</option>
                                                                        <option value="superadmin">Super Admin</option>
                                                                        <option value="manager">Manager</option>
                                                                        <option value="driver">Driver</option>
                                                                    </select>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    <button
                                                                        type="submit"
                                                                        className="bg-electric-blue hover:bg-sky-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-electric-blue/20"
                                                                    >
                                                                        Update Role
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedUserId(null)}
                                                                        className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}