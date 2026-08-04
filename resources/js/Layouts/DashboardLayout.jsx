import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Car, Map as MapIcon, Settings, Users, LogOut, Wrench, Fuel, FileText, Menu, X, Bell, Shield, Route, BarChart3, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }) {
    const { url, props } = usePage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const unreadCount = props.auth?.unreadNotificationsCount || 0;
    const userRole = props.auth?.user?.role || '';

    // Flash message toast
    useEffect(() => {
        if (props.flash?.error) {
            setToast({ type: 'error', message: props.flash.error });
        } else if (props.flash?.success) {
            setToast({ type: 'success', message: props.flash.success });
        }
    }, [props.flash?.error, props.flash?.success]);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="h-screen w-full bg-gray-900 text-white flex overflow-hidden">

            {/* Flash Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md max-w-md ${
                            toast.type === 'error'
                                ? 'bg-rose-500/20 border-rose-500/30 text-rose-200'
                                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                        }`}
                    >
                        {toast.type === 'error'
                            ? <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                            : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        }
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Header (Visible only on small screens) */}
            <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-gray-900/80 backdrop-blur-md z-40 border-b border-white/10 flex items-center justify-between px-4">
                <Link href={route('dashboard')} className="text-electric-blue font-bold text-xl flex items-center gap-2">
                    <MapIcon className="w-6 h-6" />
                    FKG.Fleet
                </Link>
                <button onClick={toggleMenu} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={closeMenu}
                    >
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-64 h-full bg-gray-900 border-r border-white/10 shadow-2xl flex flex-col justify-between"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 flex flex-col gap-6 overflow-y-auto">
                                <div className="flex justify-between items-center mt-2">
                                    <Link href={route('dashboard')} onClick={closeMenu} className="text-electric-blue font-bold text-2xl flex items-center gap-2">
                                        FKG.Fleet
                                    </Link>
                                    <button onClick={closeMenu} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <ul className="flex flex-col gap-2 w-full mt-4">
                                    {userRole !== 'driver' && <NavItem href={route('dashboard')} icon={<MapIcon />} label="Live Map" active={url === '/dashboard'} onClick={closeMenu} isMobile />}
                                    {userRole !== 'driver' && <NavItem href={route('dashboard.vehicles')} icon={<Car />} label="Vehicles" active={url.startsWith('/dashboard/vehicles')} onClick={closeMenu} isMobile />}
                                    {userRole !== 'driver' && <NavItem href={route('dashboard.drivers')} icon={<Users />} label="Drivers" active={url.startsWith('/dashboard/drivers')} onClick={closeMenu} isMobile />}
                                    <NavItem href={route('dashboard.maintenance')} icon={<Wrench />} label="Maintenance" active={url.startsWith('/dashboard/maintenance')} onClick={closeMenu} isMobile />
                                    <NavItem href={route('dashboard.fuel')} icon={<Fuel />} label="Fuel" active={url.startsWith('/dashboard/fuel')} onClick={closeMenu} isMobile />
                                    {userRole !== 'driver' && <NavItem href={route('dashboard.trips')} icon={<Route />} label="Trip History" active={url.startsWith('/dashboard/trips')} onClick={closeMenu} isMobile />}
                                    {userRole !== 'driver' && <NavItem href={route('dashboard.chat')} icon={<MessageSquare />} label="Chat" active={url.startsWith('/dashboard/chat')} onClick={closeMenu} isMobile />}
                                    {userRole !== 'driver' && <NavItem href={route('dashboard.compliance')} icon={<FileText />} label="Compliance" active={url.startsWith('/dashboard/compliance')} onClick={closeMenu} isMobile />}
                                    {['super_admin', 'superadmin', 'admin'].includes(userRole) && <NavItem href={route('dashboard.financial-reports')} icon={<BarChart3 />} label="Financial Reports" active={url.startsWith('/dashboard/financial-reports')} onClick={closeMenu} isMobile />}
                                    {['super_admin', 'superadmin', 'admin'].includes(userRole) && <NavItem href={route('dashboard.users')} icon={<Shield />} label="Users" active={url.startsWith('/dashboard/users')} onClick={closeMenu} isMobile />}
                                    <NavItem href={route('dashboard.notifications')} icon={<Bell />} label="Notifications" active={url.startsWith('/dashboard/notifications')} onClick={closeMenu} isMobile badge={unreadCount} />
                                    <NavItem href={route('profile.edit')} icon={<Settings />} label="Settings" active={url.startsWith('/profile')} onClick={closeMenu} isMobile />
                                </ul>
                            </div>

                            <div className="p-4 border-t border-white/10">
                                <Link href={route('logout')} method="post" as="button" className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors w-full text-left p-2 rounded-xl hover:bg-white/5">
                                    <LogOut className="w-6 h-6" />
                                    <span className="font-medium">Log out</span>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar Navigation */}
            <nav className="w-20 lg:w-64 z-40 glass-panel m-4 flex flex-col justify-between hidden md:flex">
                <div className="p-4 flex flex-col items-center lg:items-start gap-8">
                    <Link href={route('dashboard')} className="text-electric-blue font-bold text-xl lg:text-2xl mt-4 flex items-center gap-2">
                        <span className="hidden lg:inline">FKG.Fleet</span>
                        <MapIcon className="lg:hidden w-8 h-8" />
                    </Link>

                    <ul className="flex flex-col gap-6 w-full mt-8">
                        {userRole !== 'driver' && <NavItem href={route('dashboard')} icon={<MapIcon />} label="Live Map" active={url === '/dashboard'} />}
                        {userRole !== 'driver' && <NavItem href={route('dashboard.vehicles')} icon={<Car />} label="Vehicles" active={url.startsWith('/dashboard/vehicles')} />}
                        {userRole !== 'driver' && <NavItem href={route('dashboard.drivers')} icon={<Users />} label="Drivers" active={url.startsWith('/dashboard/drivers')} />}
                        <NavItem href={route('dashboard.maintenance')} icon={<Wrench />} label="Maintenance" active={url.startsWith('/dashboard/maintenance')} />
                        <NavItem href={route('dashboard.fuel')} icon={<Fuel />} label="Fuel" active={url.startsWith('/dashboard/fuel')} />
                        {userRole !== 'driver' && <NavItem href={route('dashboard.trips')} icon={<Route />} label="Trip History" active={url.startsWith('/dashboard/trips')} />}
                        {userRole !== 'driver' && <NavItem href={route('dashboard.chat')} icon={<MessageSquare />} label="Chat" active={url.startsWith('/dashboard/chat')} />}
                        {userRole !== 'driver' && <NavItem href={route('dashboard.compliance')} icon={<FileText />} label="Compliance" active={url.startsWith('/dashboard/compliance')} />}
                        {['super_admin', 'superadmin', 'admin'].includes(userRole) && <NavItem href={route('dashboard.financial-reports')} icon={<BarChart3 />} label="Financial Reports" active={url.startsWith('/dashboard/financial-reports')} />}
                        {['super_admin', 'superadmin', 'admin'].includes(userRole) && <NavItem href={route('dashboard.users')} icon={<Shield />} label="Users" active={url.startsWith('/dashboard/users')} />}
                        <NavItem href={route('dashboard.notifications')} icon={<Bell />} label="Notifications" active={url.startsWith('/dashboard/notifications')} badge={unreadCount} />
                        <NavItem href={route('profile.edit')} icon={<Settings />} label="Settings" active={url.startsWith('/profile')} />
                    </ul>
                </div>

                <div className="p-4 flex justify-center lg:justify-start">
                    <Link href={route('logout')} method="post" as="button" className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors w-full text-left p-2 lg:px-4 rounded-xl hover:bg-white/5">
                        <LogOut className="w-6 h-6" />
                        <span className="hidden lg:inline font-medium">Log out</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto mt-16 md:mt-0">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, active = false, onClick, isMobile = false, badge = 0 }) {
    return (
        <Link href={href} onClick={onClick} className={`flex items-center gap-4 p-2 ${isMobile ? 'px-4' : 'lg:px-4'} cursor-pointer rounded-xl transition-all duration-300 ${active ? 'bg-electric-blue/20 text-electric-blue' : 'text-gray-400 hover:bg-white/5 hover:text-white'} relative`}>
            <div className="w-6 h-6">{icon}</div>
            <span className={`${isMobile ? 'inline' : 'hidden lg:inline'} font-medium flex-1`}>{label}</span>
            {badge > 0 && (
                <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {badge > 99 ? '99+' : badge}
                </div>
            )}
        </Link>
    );
}
