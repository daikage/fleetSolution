import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Bell, Check, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Notifications({ notifications }) {
    const { post: markRead } = useForm();

    const markAsRead = (id) => {
        markRead(route('dashboard.notifications.markAsRead', id), {
            preserveScroll: true
        });
    };

    const markAllAsRead = () => {
        markRead(route('dashboard.notifications.markAllAsRead'), {
            preserveScroll: true
        });
    };

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <DashboardLayout>
            <Head title="Notifications" />

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Bell className="w-8 h-8 text-electric-blue" />
                            Notifications
                        </h1>
                        <p className="text-gray-400 mt-1">You have {unreadCount} unread messages.</p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors border border-white/10"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>You're all caught up!</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {notifications.map((notification) => (
                                <motion.li 
                                    key={notification.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 md:p-6 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start ${
                                        !notification.read_at ? 'bg-electric-blue/5' : 'hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            {!notification.read_at && (
                                                <div className="w-2 h-2 rounded-full bg-electric-blue shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                                            )}
                                            <h3 className={`text-lg ${!notification.read_at ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>
                                                {notification.data.message}
                                            </h3>
                                        </div>
                                        
                                        {notification.data.cost && (
                                            <p className="text-gray-400 text-sm">
                                                Amount: <span className="text-emerald-400 font-semibold">${parseFloat(notification.data.cost).toFixed(2)}</span>
                                            </p>
                                        )}
                                        {notification.data.comment && (
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5 mt-2">
                                                <p className="text-sm text-gray-300 italic">"{notification.data.comment}"</p>
                                            </div>
                                        )}
                                        
                                        <p className="text-xs text-gray-500">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {notification.data.url && (
                                            <Link 
                                                href={notification.data.url}
                                                className="text-sm text-electric-blue hover:text-sky-300 transition-colors"
                                            >
                                                View {notification.data.request_type} &rarr;
                                            </Link>
                                        )}
                                        {!notification.read_at && (
                                            <button 
                                                onClick={() => markAsRead(notification.id)}
                                                className="ml-auto md:ml-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
